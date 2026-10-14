import { defineTool } from "eve/tools";
import { z } from "zod";
import { requireWorkerScope } from "@agent/subagents/browser-agent/lib/access";
import { requireOwnedBrowserSession } from "@agent/subagents/browser-agent/lib/owned-browser";
import {
  readVaultItems,
  readVaultItem,
  readVaultSecret,
} from "@db/services/vault";
import { parseLoginVaultPayload } from "@shared/vault/schema";
import { create, get, close, inspect, persist } from "../lib/provider";
import { safeBrowserUrl, validateLoginOrigin } from "../lib/security";
export default defineTool({
  description:
    "Browserbase Free prototype: create, inspect, navigate, click a link or sign-in button, fill a non-secret field, securely fill a saved login, list saved login handles, close. Account modifications, purchases and message submissions are not enabled. Never put passwords in text.",
  inputSchema: z.object({
    action: z.enum([
      "create",
      "inspect",
      "navigate",
      "click",
      "fill",
      "vault_list",
      "vault_fill",
      "close",
    ]),
    sessionId: z.string().optional(),
    url: z.url().optional(),
    selector: z.string().optional(),
    text: z.string().max(2000).optional(),
    handle: z.string().optional(),
  }),
  async execute(input, ctx) {
    if (input.action === "create" && !input.url)
      throw new Error(
        "create requires url: the complete HTTPS target from the assigned task."
      );
    const scope = await requireWorkerScope(ctx);
    if (input.action === "vault_list")
      return (await readVaultItems(scope))
        .filter((v) => v.kind === "login")
        .map((v) => ({
          handle: v.id,
          label: v.label,
          account: v.account,
          available: v.hasSecret,
        }));
    if (input.action === "create")
      return {
        sessionId: await create(scope, ctx.session.id, input.url ?? ""),
      };
    const id = input.sessionId;
    if (!id) throw new Error("sessionId required");
    await requireOwnedBrowserSession(scope, id);
    const session = get(scope, id),
      page = session.page;
    try {
      switch (input.action) {
        case "inspect":
          return inspect(scope, id);
        case "close":
          await close(scope, id);
          return { closed: true };
        case "navigate":
          await page.goto(await safeBrowserUrl(input.url ?? ""), {
            waitUntil: "domcontentloaded",
            timeout: 25000,
          });
          await persist(scope, id);
          return inspect(scope, id);
        case "click": {
          const control = page.locator(input.selector ?? "");
          const info = await control.evaluate((el) => ({
            tag: el.tagName,
            href: el.getAttribute("href"),
            label: el.getAttribute("aria-label") ?? el.textContent ?? "",
          }));
          if (info.tag === "A" && info.href) {
            await safeBrowserUrl(new URL(info.href, page.url()).href);
          } else if (
            !/^(sign[ -]?in|log[ -]?in|next|continue|verify|submit code)$/i.test(
              info.label.trim()
            )
          )
            throw new Error(
              "This prototype only allows navigation and authentication. Account changes require a separately reviewed action flow."
            );
          await control.click({ timeout: 10000 });
          await page
            .waitForLoadState("domcontentloaded", { timeout: 10000 })
            .catch(() => {});
          await persist(scope, id);
          return inspect(scope, id);
        }
        case "fill": {
          const target = page.locator(input.selector ?? "");
          if ((await target.getAttribute("type")) === "password")
            throw new Error(
              "Use vault_fill for passwords. Never supply them through the model."
            );
          await target.fill(input.text ?? "", { timeout: 10000 });
          return { filled: true };
        }
        case "vault_fill": {
          const item = await readVaultItem(scope, input.handle ?? "");
          if (!item || item.kind !== "login")
            throw new Error(
              "Saved login not found. Add it through /vault, not chat."
            );
          const value = await readVaultSecret(scope, item.id),
            login = value ? parseLoginVaultPayload(value) : null;
          if (!login || !("origin" in login))
            throw new Error("Save an origin-bound login in /vault.");
          await safeBrowserUrl(page.url());
          validateLoginOrigin(login.origin, page.url());
          session.redactions.push(login.identifier.value);
          const password = page.locator('input[type="password"]:visible');
          const user = page
            .locator(
              'input[autocomplete="username"]:visible,input[type="email"]:visible,input[name="username"]:visible,input[name="email"]:visible,input[name="login"]:visible,input[type="text"]:visible'
            )
            .first();
          if (await user.count())
            await user.fill(login.identifier.value, { timeout: 10000 });
          if (login.authentication.type === "password") {
            session.redactions.push(login.authentication.password);
            if ((await password.count()) !== 1)
              throw new Error(
                "Exactly one visible password field is required for secure fill."
              );
            session.authPostUrl = await password.evaluate(
              (el) => (el as HTMLInputElement).form?.action ?? location.href
            );
            // Recheck current origin immediately before releasing the secret to the page.
            validateLoginOrigin(login.origin, page.url());
            await password.fill(login.authentication.password, {
              timeout: 10000,
            });
          }
          return {
            filled: true,
            origin: new URL(page.url()).origin,
            method: login.authentication.type,
          };
        }
      }
    } catch (error) {
      if (session.redactions.length)
        throw new Error(
          "Browser operation stopped after secure login fill. No credential values returned. Inspect the page for a safe status or close the session."
        );
      throw error;
    }
  },
});
