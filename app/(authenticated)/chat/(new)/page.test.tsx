import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import NewChatPage from "./page";
vi.mock("./_components/new-chat", () => ({ NewChat: () => <textarea aria-label="Message" /> }));
describe("new chat landing", () => {
  it("uses the same chat shell before a session exists", () => {
    const html = renderToStaticMarkup(<NewChatPage />);
    expect(html).toContain("Assistant");
    expect(html).toContain("Ready to chat");
    expect(html).toContain("whatsapp-chat-bg");
    expect(html).toContain("on your mind?");
    expect(html).not.toContain("Local Vault");
    expect(html).not.toContain("OpenInstinct");
  });
});
