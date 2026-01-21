import { useEffect, useRef, useState } from "react";
import { useThreadActions, useThreadState } from "@crayonai/react-core";
import { Suggestions, type Suggestion } from "./Suggestions";
import { AnimatePresence } from "framer-motion";
import { config } from "@/config";
import { processSheetFile } from "@/services/sheetProcessor";
import { ComposerInput } from "./ComposerInput";
import { useFileDrag } from "@/hooks/useFileDrag";
import { useFileHandler } from "@/hooks/useFileHandler";
import type { JSONValue } from "@crayonai/stream";

export const Composer = ({
  pushQueryTitle,
}: {
  pushQueryTitle: (title: string) => void;
}) => {
  const { processMessage, onCancel } = useThreadActions();
  const { isRunning } = useThreadState();
  const { messages = [] } = useThreadState();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>(
    messages.length === 0 ? config.prefilledSuggestions ?? [] : []
  );
  const inputContainerRef = useRef<HTMLDivElement>(null);

  const {
    files,
    totalFileSize,
    handleFileChange,
    handleFilesDropped,
    removeFile,
    clearFiles,
    processFiles,
    isAtSizeLimit,
  } = useFileHandler();

  const { isDragging, dragHandlers } = useFileDrag({
    onFilesDropped: handleFilesDropped,
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const executePrompt = async (prompt: string) => {
    const contexts = await processFiles(async (file) => {
      const result = await processSheetFile(file);
      return result.content;
    });

    processMessage({
      type: "prompt",
      role: "user",
      message: prompt,
      context: contexts.length > 0 ? contexts as JSONValue[] : undefined,
    });

    clearFiles();
  };

  useEffect(() => {
    if (messages.length === 0) return; // Only show suggestions after an assistant message

    if ((isRunning ?? false) || messages.length % 2 !== 0) {
      setSuggestions([]);
      return;
    }

    const latestMessage = messages[messages.length - 1];

    let messageText: string | null = null;

    if (typeof latestMessage.message === "string") {
      messageText = latestMessage.message;
    } else if (Array.isArray(latestMessage.message)) {
      messageText = latestMessage.message
        .map((m: unknown) => (typeof m === "string" ? m : JSON.stringify(m)))
        .join(" ");
    } else if (
      latestMessage.message &&
      typeof latestMessage.message === "object"
    ) {
      messageText = JSON.stringify(latestMessage.message);
    }

    if (!messageText) {
      return;
    }

//     fetch("http://127.0.0.1:8000/relatedQueries", {
//       method: "POST",
//       body: JSON.stringify({
//         message: messageText,
//       }),
//     })
//       .then((res) => res.json())
//       .then((data) => {
//   // Ensure we always set an array, even if the API returns null/undefined
//   setSuggestions(data?.relatedQueries || []); 
// })
// .catch(() => {
//   // Good practice: If the fetch fails entirely, reset to empty array
//   setSuggestions([]); 
// });
  }, [isRunning, messages, messages.length]);

  return (
    <div className="flex flex-col gap-l bg-none relative">
      <AnimatePresence>
        {suggestions?.length > 0 && (
          <Suggestions
            key="suggestions"
            suggestions={suggestions}
            collapsed={messages.length > 0}
            executePrompt={executePrompt}
            pushQueryTitle={pushQueryTitle}
            inputContainerRef={inputContainerRef}
          />
        )}
      </AnimatePresence>

      <ComposerInput
        inputContainerRef={inputContainerRef}
        onSubmit={executePrompt}
        isRunning={isRunning}
        onCancel={onCancel}
        fileState={{
          files,
          totalFileSize,
          isAtSizeLimit,
          handleFileChange,
          handleFilesDropped,
          removeFile,
        }}
        dragState={{
          isDragging,
          dragHandlers,
        }}
        onClearFiles={clearFiles}
      />
    </div>
  );
};