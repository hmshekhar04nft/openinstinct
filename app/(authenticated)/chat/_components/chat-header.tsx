import { MessageCircleIcon } from "lucide-react";

export function ChatHeader() {
  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <MessageCircleIcon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-medium leading-tight">Assistant</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-1.5 rounded-full bg-primary" />Ready to chat</p>
      </div>
    </header>
  );
}
