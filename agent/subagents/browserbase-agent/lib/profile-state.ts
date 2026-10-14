import type { BrowserContext } from "playwright-core";
type State = Awaited<ReturnType<BrowserContext["storageState"]>>;
/** Restore only the requested origin, never unrelated accounts' state. */
export function profileForOrigin(state: State, origin: string): State {
  const host = new URL(origin).hostname;
  return {
    cookies: state.cookies.filter((c) => {
      const domain = c.domain.replace(/^\./, "");
      return host === domain || host.endsWith(`.${domain}`);
    }),
    origins: state.origins.filter((o) => o.origin === origin),
  };
}
