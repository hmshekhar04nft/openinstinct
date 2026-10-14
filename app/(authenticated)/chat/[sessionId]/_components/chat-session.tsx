"use client";

import { MessageCircleIcon } from "lucide-react";
import { useState } from "react";
import type { ChatUsage } from "@shared/chat/schema";
import type { TraceView } from "../_lib/trace-view";
import { SubagentPanel } from "./activity";
import { ChatConversation } from "./conversation";
import { ChatInput } from "./input";
import { useSessionAgent } from "./use-session-agent";

export function ChatSession({
  initialUsage,
  sessionId,
}: {
  readonly initialUsage?: ChatUsage;
  readonly sessionId: string;
}) {
  const [traceView, setTraceView] = useState<TraceView>("imessage");
  const agent = useSessionAgent(sessionId);

  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-background text-foreground">
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <MessageCircleIcon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium leading-tight">
              Assistant
            </p>
            <p className="text-xs leading-tight text-muted-foreground">
              online
            </p>
          </div>
        </header>
        <div className="whatsapp-chat-bg relative flex min-h-0 flex-1 flex-col">
        <ChatConversation
          agent={agent}
          initial={false}
          history={{
            hasOlder: agent.hasOlder,
            isLoadingOlder: agent.isLoadingOlder,
            loadOlder: agent.loadOlder,
          }}
          sessionId={sessionId}
          traceView={traceView}
        />
        <ChatInput agent={agent} sessionId={sessionId} />
        </div>
      </div>
      <SubagentPanel
        events={agent.events}
        historyComplete={!agent.hasOlder}
        initialUsage={initialUsage}
        onTraceViewChange={setTraceView}
        sessionId={sessionId}
        traceView={traceView}
      />
    </div>
  );
}
