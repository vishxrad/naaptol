import type { AssistantMessage, UserMessage } from "@crayonai/react-core";
import { C1Component } from "@thesysai/genui-sdk";
import { useThreadState, useThreadActions } from "@crayonai/react-core";
import { MessageLoader } from "../MessageLoader";
import { withRetry } from "@/app/helpers/retryWithBackoff";
import { useState, useCallback } from "react";

const MAX_RETRIES = 3;

interface MessageGroupProps {
  queryTitle?: string;
  userMessage?: UserMessage;
  assistantMessage?: AssistantMessage;
}

export const MessageGroup = ({
  queryTitle,
  userMessage,
  assistantMessage,
}: MessageGroupProps) => {
  const { isRunning } = useThreadState();
  const { processMessage } = useThreadActions();
  const [retryAttempts, setRetryAttempts] = useState(0);
  const assistantMessageContent = getAssistantMessageContent(assistantMessage);

  // 1. Implement the onAction handler
  const handleAction = useCallback(
    async (event: any) => {
      const { type, params } = event;

      switch (type) {
        case "open_url":
          if (params?.url) {
            window.open(params.url, "_blank", "noopener,noreferrer");
          }
          break;

        default:
          // Destructure both the AI instruction and the UI label
          const { llmFriendlyMessage, humanFriendlyMessage } = params || {};

          // We need at least one of them to proceed
          if (llmFriendlyMessage || humanFriendlyMessage) {
            await processMessage({
              type: "prompt",
              role: "user",
              // UI Logic: Show the human-friendly label (e.g. "Notifications") 
              // If that's missing, fall back to the LLM message.
              message: humanFriendlyMessage || llmFriendlyMessage,
              
              // Backend Logic: Pass the full params (including the raw llmFriendlyMessage)
              // as context so the AI still receives the exact data it needs.
              context: params, 
            });
          }
          break;
      }
    },
    [processMessage]
  );

  const handleError = useCallback(
    async (error: { code: number; c1Response: string }) => {
      if (!userMessage) {
        console.error("No user message available for retry", error);
        return;
      }

      if (retryAttempts >= 3) {
        console.error("Max retry attempts (3) reached", error);
        return;
      }

      try {
        await withRetry(
          async () => {
            await processMessage({
              type: "prompt",
              role: "user",
              message: userMessage.message || "",
              context: userMessage.context,
            });
          },
          MAX_RETRIES,
          1000,
          5000
        );
        setRetryAttempts(MAX_RETRIES + 1);
      } catch (retryError) {
        setRetryAttempts((prev) => prev + 1);
        console.error("All retry attempts failed:", retryError);
      }
    },
    [userMessage, retryAttempts, processMessage]
  );

  return (
    <div className="flex flex-col gap-s">
      {queryTitle ? (
        <div className="text-xl text-primary font-semibold">{queryTitle}</div>
      ) : (
        userMessage && (
          <div className="text-xl text-primary font-semibold break-all">
            {userMessage.message}
          </div>
        )
      )}
      {assistantMessage ? (
        <C1Component
          key={assistantMessage.id}
          c1Response={assistantMessageContent}
          isStreaming={isRunning || false}
          onError={handleError}
          onAction={handleAction} // 2. Pass the handler here
        />
      ) : (
        <MessageLoader />
      )}
    </div>
  );
};

const getAssistantMessageContent = (
  assistantMessage: AssistantMessage | undefined
) => {
  if (!assistantMessage?.message) return "";

  if (assistantMessage.message[0]?.type === "text") {
    return assistantMessage.message[0].text;
  }
  return assistantMessage.message[0].templateProps.content;
};