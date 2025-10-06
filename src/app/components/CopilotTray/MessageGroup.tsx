import type { AssistantMessage, UserMessage } from "@crayonai/react-core";
import { C1Component } from "@thesysai/genui-sdk";
import { useThreadState, useThreadActions } from "@crayonai/react-core";
import { MessageLoader } from "../MessageLoader";
import { withRetry } from "@/app/helpers/retryWithBackoff";
import { useState, useCallback } from "react";

const MAX_RETRIES = 3

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
          MAX_RETRIES, // Retry up to 3 times with exponential backoff
          1000,
          5000
        );
        // If successful, increment retry count to prevent further retries
        setRetryAttempts(MAX_RETRIES + 1);
      } catch (retryError) {
        // Increment retry count on failure
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
