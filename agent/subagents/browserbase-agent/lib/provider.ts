import { chromium, type Browser, type Page } from "playwright-core";
import { sql } from "drizzle-orm";
import { db } from "@db";
import type { AccessScope } from "@shared/identity/access-scope";
import { readBrowserProfile, writeBrowserProfile } from "@db/services/vault";
import {
  createBrowserSession,
  deleteBrowserSession,
  withBrowserProfileWriteLock,
} from "@db/services/browsers";
import { safeBrowserUrl } from "./security";
import { profileForOrigin } from "./profile-state";
const sessions = new Map<
  string,
  {
    browser: Browser;
    page: Page;
    workspaceId: string;
    redactions: string[];
    authPostUrl?: string;
    ephemeral?: boolean;
  }
>();
function configured() {
  const key = process.env.BROWSERBASE_API_KEY;
  if (!key || process.env.BROWSERBASE_ENABLED !== "true")
    throw new Error(
      "Browser is not configured yet. Browserbase Free account setup is required."
    );
  return key;
}
async function api(path: string, body?: unknown) {
  const response = await fetch(`https://api.browserbase.com/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      "X-BB-API-Key": configured(),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok)
    throw new Error(
      `Browser provider request failed (${response.status}). No automatic paid upgrade is allowed.`
    );
  return response.json();
}
export async function create(
  scope: AccessScope,
  workerSessionId: string,
  url: string,
  options: { publicOnly?: boolean } = {}
) {
  configured();
  await safeBrowserUrl(url);
  const usage = await api(
    `projects/${process.env.BROWSERBASE_PROJECT_ID}/usage`
  );
  if (typeof usage.browserMinutes !== "number" || usage.browserMinutes + 3 > 54)
    throw new Error(
      "Free browser allowance unavailable or exhausted. No paid fallback."
    );
  // Reserve full timeout, including failed attempts. Global app cap below the free 1h.
  const result = await db.execute(
    sql`INSERT INTO assistant_browser_usage(month,reserved_seconds) VALUES (to_char(now(),'YYYY-MM'),180) ON CONFLICT (month) DO UPDATE SET reserved_seconds=assistant_browser_usage.reserved_seconds+180 WHERE assistant_browser_usage.reserved_seconds+180<=3240 RETURNING reserved_seconds`
  );
  if (!result.rows.length)
    throw new Error(
      "This month's free browser quota has been reached. No paid fallback."
    );
  const remote = await api("sessions", {
    projectId: process.env.BROWSERBASE_PROJECT_ID,
    timeout: 180,
    keepAlive: false,
    browserSettings: {
      recordSession: false,
      logSession: false,
      solveCaptchas: false,
    },
    proxies: false,
  });
  let browser: Browser | undefined;
  try {
    browser = await chromium.connectOverCDP(remote.connectUrl);
    const context = browser.contexts()[0]!;
    await context.route("**/*", async (route) => {
      try {
        const target = route.request().url();
        if (target.startsWith("data:") || target.startsWith("blob:"))
          return route.continue();
        await safeBrowserUrl(target);
        const method = route.request().method();
        if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
          const active = sessions.get(remote.id);
          if (method !== "POST" || active?.authPostUrl !== target)
            return route.abort();
        }
        await route.continue();
      } catch {
        await route.abort();
      }
    });
    const stored = options.publicOnly
      ? undefined
      : await readBrowserProfile(scope);
    if (stored) {
      const state = profileForOrigin(JSON.parse(stored), new URL(url).origin);
      if (state.cookies) await context.addCookies(state.cookies);
      if (state.origins)
        await context.addInitScript(
          ({
            origins,
          }: {
            origins: Array<{
              origin: string;
              localStorage: Array<{ name: string; value: string }>;
            }>;
          }) => {
            const found = origins.find((v) => v.origin === location.origin);
            for (const item of found?.localStorage ?? [])
              localStorage.setItem(item.name, item.value);
          },
          { origins: state.origins }
        );
    }
    const page = context.pages()[0] ?? (await context.newPage());
    await createBrowserSession(scope, {
      createdAt: new Date().toISOString(),
      sessionId: remote.id,
      workerSessionId,
    });
    sessions.set(remote.id, {
      browser,
      page,
      workspaceId: scope.workspaceId,
      redactions: [],
      ephemeral: options.publicOnly,
    });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
    return remote.id as string;
  } catch (error) {
    await browser?.close().catch(() => {});
    await api(`sessions/${remote.id}`, { status: "REQUEST_RELEASE" }).catch(
      () => {}
    );
    sessions.delete(remote.id);
    await deleteBrowserSession(scope, remote.id).catch(() => {});
    throw new Error(
      "Browser session setup or navigation failed. No credentials returned."
    );
  }
}
export function get(scope: AccessScope, id: string) {
  const session = sessions.get(id);
  if (!session || session.workspaceId !== scope.workspaceId)
    throw new Error(
      "Browser session ended or is not yours. Create a new browser."
    );
  return session;
}
export async function persist(scope: AccessScope, id: string) {
  const s = get(scope, id);
  await withBrowserProfileWriteLock(scope, async () => {
    const next = await s.page.context().storageState();
    const prior = await readBrowserProfile(scope);
    if (prior) {
      const old = JSON.parse(prior);
      const originSet = new Set(next.origins.map((o) => o.origin));
      const cookieSet = new Set(
        next.cookies.map((c) => `${c.domain}\0${c.path}\0${c.name}`)
      );
      next.origins.push(
        ...(old.origins ?? []).filter(
          (o: { origin: string }) => !originSet.has(o.origin)
        )
      );
      next.cookies.push(
        ...(old.cookies ?? []).filter(
          (c: { domain: string; path: string; name: string }) =>
            !cookieSet.has(`${c.domain}\0${c.path}\0${c.name}`)
        )
      );
    }
    await writeBrowserProfile(scope, JSON.stringify(next));
  });
}
export async function close(scope: AccessScope, id: string) {
  const s = get(scope, id);
  try {
    if (!s.ephemeral) await persist(scope, id);
  } finally {
    sessions.delete(id);
    await s.browser.close().catch(() => {});
    await api(`sessions/${id}`, { status: "REQUEST_RELEASE" }).catch(() => {});
    await deleteBrowserSession(scope, id);
  }
}
export async function inspect(scope: AccessScope, id: string) {
  const s = get(scope, id);
  await safeBrowserUrl(s.page.url());
  const data = await s.page.evaluate(() => {
    const controls = Array.from(
      document.querySelectorAll(
        'a,button,input,select,textarea,[role="button"]'
      )
    )
      .filter(
        (el) =>
          el.getBoundingClientRect().width && el.getBoundingClientRect().height
      )
      .slice(0, 100)
      .map((el, i) => {
        el.setAttribute("data-browser-control", String(i));
        const element = el as HTMLInputElement;
        return {
          selector: `[data-browser-control="${i}"]`,
          tag: el.tagName.toLowerCase(),
          type: element.type,
          label:
            el.getAttribute("aria-label") ??
            el.getAttribute("placeholder") ??
            el.textContent?.slice(0, 100),
          href: el.tagName === "A" ? (el as HTMLAnchorElement).href : undefined,
        };
      });
    return {
      title: document.title,
      text: document.body.innerText.slice(0, 14000),
      controls,
    };
  });
  let text = JSON.stringify({ url: s.page.url(), ...data });
  for (const secret of s.redactions)
    if (secret) text = text.split(secret).join("[REDACTED]");
  return JSON.parse(text);
}
