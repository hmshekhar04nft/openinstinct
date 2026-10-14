"use client";

import { useEveAgent } from "eve/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@web/components/ai-elements/prompt-input";
import { chatTitle, messageContent } from "../../_lib/message-input";
import { api } from "@web/trpc/client";

export function NewChat() {
  const router = useRouter();
  const [pendingText, setPendingText] = useState("");
  const [sendError, setSendError] = useState("");
  const { mutateAsync: saveChat } = api.chats.save.useMutation();
  const pendingTitle = useRef<string | undefined>(undefined);
  const isSubmitting = useRef(false);
  const navigationStarted = useRef(false);
  const agent = useEveAgent({
    onSessionChange(session) {
      if (session === undefined || navigationStarted.current) return;
      navigationStarted.current = true;
      const path = `/chat/${encodeURIComponent(session.sessionId)}`;
      void saveChat({
        sessionId: session.sessionId,
        title: pendingTitle.current,
      })
        .catch(() => undefined)
        .then(() => {
          router.replace(path);
          return undefined;
        });
      pendingTitle.current = undefined;
    },
  });

  const handleSubmit = async (message: PromptInputMessage) => {
    const text = message.text.trim();
    if (
      (text.length === 0 && message.files.length === 0) ||
      isSubmitting.current
    ) {
      return;
    }
    isSubmitting.current = true;
    setPendingText(text);
    setSendError("");
    pendingTitle.current = chatTitle(message);
    try {
      await agent.send(messageContent(message));
    } catch {
      setSendError("Message could not be sent. Please try again.");
      setPendingText("");
    } finally {
      isSubmitting.current = false;
    }
  };

  return (
    <div>
      {pendingText ? <div className="mb-4 flex flex-col items-end gap-2"><p className="max-w-[85%] rounded-2xl rounded-tr-sm bg-secondary px-4 py-2.5 text-sm">{pendingText}</p><p className="text-xs text-muted-foreground">Sending...</p></div> : null}
      {sendError ? <p role="alert" className="mb-3 text-sm text-destructive">{sendError}</p> : null}
    <PromptInput className="rounded-3xl bg-card" compact onSubmit={handleSubmit}>
      <PromptInputBody>
        <PromptInputTextarea
          className="min-h-0"
          placeholder="Send a message…"
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools />
        <PromptInputSubmit disabled={pendingText.length > 0} />
      </PromptInputFooter>
    </PromptInput>
    </div>
  );
}
