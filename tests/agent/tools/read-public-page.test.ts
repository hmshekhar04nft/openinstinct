import { beforeEach, expect, it, vi } from "vitest";
import { toolContextFor } from "@tests/helpers/tool-context";
const mocks = vi.hoisted(() => ({
  owned: vi.fn(),
  create: vi.fn(),
  inspect: vi.fn(),
  close: vi.fn(),
}));
vi.mock("@db/services/sessions", () => ({ isSessionOwned: mocks.owned }));
vi.mock("@agent/lib/principal-scope", () => ({
  scopeFromPrincipal: () => ({ userId: "user", workspaceId: "workspace" }),
}));
vi.mock("@agent/subagents/browserbase-agent/lib/provider", () => ({
  create: mocks.create,
  inspect: mocks.inspect,
  close: mocks.close,
}));
import { readPublicPage } from "@agent/tools/read_public_page";
function context() {
  const ctx = toolContextFor();
  return {
    ...ctx,
    session: {
      ...ctx.session,
      auth: {
        ...ctx.session.auth,
        current: {
          principalId: "user",
          authenticator: "test",
          principalType: "user",
          attributes: { workspaceId: "workspace" },
        },
      },
    },
  } as Parameters<typeof readPublicPage.execute>[1];
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.owned.mockResolvedValue(true);
  mocks.create.mockResolvedValue("browser-1");
  mocks.inspect.mockResolvedValue({
    url: "https://example.com/",
    text: "Example",
  });
  mocks.close.mockResolvedValue(undefined);
});
it("reads one page in an isolated profile and closes before returning", async () => {
  expect(
    await readPublicPage.execute({ url: "https://example.com/" }, context())
  ).toEqual({ url: "https://example.com/", text: "Example" });
  expect(mocks.create).toHaveBeenCalledWith(
    { userId: "user", workspaceId: "workspace" },
    "test-session",
    "https://example.com/",
    { publicOnly: true }
  );
  expect(mocks.close).toHaveBeenCalledOnce();
});
it("closes on inspection failure", async () => {
  mocks.inspect.mockRejectedValue(new Error("Navigation blocked"));
  await expect(
    readPublicPage.execute({ url: "https://example.com/" }, context())
  ).rejects.toThrow("Navigation blocked");
  expect(mocks.close).toHaveBeenCalledOnce();
});
it("rejects unowned sessions before starting a browser", async () => {
  mocks.owned.mockResolvedValue(false);
  await expect(
    readPublicPage.execute({ url: "https://example.com/" }, context())
  ).rejects.toThrow("does not own");
  expect(mocks.create).not.toHaveBeenCalled();
});
it("rejects anonymous callers", async () => {
  await expect(
    readPublicPage.execute({ url: "https://example.com/" }, toolContextFor())
  ).rejects.toThrow("authenticated");
  expect(mocks.create).not.toHaveBeenCalled();
});
