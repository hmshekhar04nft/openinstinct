import { MessageSquareIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import {
  combineChatUsage,
  formatChatUsage,
} from "@app/(authenticated)/chat/_lib/chat-usage";
import { listChats } from "@db/services/chats";
import { requireRequestScope } from "@web/auth/request-scope";

export const dynamic = "force-dynamic";

export default async function AllChatsPage() {
  const scope = await requireRequestScope();
  const chats = await listChats(scope);
  const totalUsage = combineChatUsage(chats.map((chat) => chat.usage));
  const imessageSessionId = chats.find(
    (chat) => chat.channel === "channel:linq"
  )?.sessionId;

  return (
    <div className="relative mx-auto flex min-h-full w-full max-w-2xl flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
        <h1 className="text-xl font-semibold text-foreground">Chats</h1>
        <p className="text-xs text-muted-foreground">
          Usage {formatChatUsage(totalUsage)}
        </p>
      </header>

      <section aria-label="Chat history" className="flex-1 divide-y divide-border/60">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <MessageSquareIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No chats yet. Tap the green button to start one.
            </p>
          </div>
        ) : (
          chats.map((chat) => (
            <Link
              key={chat.sessionId}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
              href={`/chat/${encodeURIComponent(chat.sessionId)}`}
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted">
                <MessageSquareIcon className="size-5 text-muted-foreground" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-medium text-foreground">
                  {chat.sessionId === imessageSessionId
                    ? "iMessage"
                    : chat.title}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {formatChatUsage(chat.usage)}
                </span>
              </span>
              <time
                className="shrink-0 text-xs text-muted-foreground"
                dateTime={chat.updatedAt}
              >
                {formatChatDate(chat.updatedAt)}
              </time>
            </Link>
          ))
        )}
      </section>

      <Link
        aria-label="New chat"
        className="fixed bottom-6 right-6 z-20 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
        href="/chat"
      >
        <PlusIcon className="size-6" />
      </Link>
    </div>
  );
}

function formatChatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
