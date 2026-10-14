import { MessageCircleIcon } from "lucide-react";
import { ChatHeader } from "../_components/chat-header";
import { NewChat } from "./_components/new-chat";

export default function NewChatPage() {
  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden text-foreground" aria-label="New conversation">
      <ChatHeader />
      <div className="whatsapp-chat-bg relative flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 items-center justify-center px-7 py-8">
          <div className="max-w-xs text-center">
            <span className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary"><MessageCircleIcon className="size-8" /></span>
            <h1 className="text-2xl font-medium tracking-tight">What's on your mind?</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Ask a question, plan something, or get help with your day.</p>
          </div>
        </div>
        <div className="mx-auto w-full max-w-3xl px-3 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6"><NewChat /></div>
      </div>
    </section>
  );
}
