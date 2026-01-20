import { useEffect, useRef, useState } from "react";
import { useThreadActions, useThreadState } from "@crayonai/react-core";
import { Suggestions, type Suggestion } from "./Suggestions";
import { config } from "@/config";
import { ComposerInput } from "./ComposerInput";
import { AnimatePresence } from "framer-motion";

export const Composer = ({
  pushQueryTitle,
}: {
  pushQueryTitle: (title: string) => void;
}) => {
  const { processMessage, onCancel } = useThreadActions();
  const { isRunning } = useThreadState();
  const { messages } = useThreadState();
  const [suggestions, setSuggestions] = useState<Suggestion[]>(
    messages.length === 0 ? config.prefilledSuggestions ?? [] : []
  );
  const inputContainerRef = useRef<HTMLDivElement>(null);

  const executePrompt = async (prompt: string) => {
    processMessage({
      type: "prompt",
      role: "user",
      message: prompt,
    });
  };

  useEffect(() => {
    if (messages.length === 0) return; // Only show suggestions after an assistant message

    if ((isRunning ?? false) || messages.length % 2 !== 0) {
      setSuggestions([]);
      return;
    }
    
    // Related queries fetch removed as the endpoint is deprecated
  }, [isRunning, messages, messages.length]);

  return (
    <div className="flex flex-col gap-l bg-none relative">
      <AnimatePresence>
        {suggestions.length > 0 && (
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
      />
    </div>
  );
};
