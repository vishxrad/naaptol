import { IconButton } from "@crayonai/react-ui";
import { ArrowUp, StopCircle } from "lucide-react";
import React, { useRef, useState } from "react";
import clsx from "clsx";
import { useIsMobile } from "@/hooks/useIsMobile";

interface ComposerInputProps {
  onSubmit: (text: string) => void;
  isRunning: boolean | undefined;
  onCancel: () => void;
  inputContainerRef: React.RefObject<HTMLDivElement | null>;
}

export const ComposerInput = ({
  inputContainerRef,
  onSubmit,
  isRunning,
  onCancel,
}: ComposerInputProps) => {
  const [textContent, setTextContent] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isTextAreaExpanded, setIsTextAreaExpanded] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile()

  const handleSubmit = async () => {
    if (!textContent.trim() || (isRunning ?? false)) {
      return;
    }

    onSubmit(textContent);
    setTextContent("");
    if (textAreaRef.current) {
      // reset text area state
      textAreaRef.current.rows = 1;
      setIsTextAreaExpanded(false);
    }
  };

  return (
    <div
      className={clsx(
        "flex flex-col gap-m p-m border rounded-[18px] bg-container",
        !isFocused && "border-interactive-el",
        isFocused && "border-emphasis"
      )}
      ref={inputContainerRef}
    >
      <div
        className={clsx(
          "flex gap-s",
          !isTextAreaExpanded && "items-center justify-between",
          isTextAreaExpanded && "flex-col"
        )}
      >
        <textarea
          ref={textAreaRef}
          rows={1}
          placeholder="Type here..."
          className={clsx(
            "flex-1 pl-[8px] outline-none resize-none",
            isFocused && "border-primary"
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          value={textContent}
          onChange={(e) => {
            const textarea = e.target;
            const isOverflowing = textarea.scrollHeight > textarea.clientHeight;
            if (isOverflowing) {
              textarea.rows = isMobile ? 2 : 4;
              setIsTextAreaExpanded(true);
            }
            setTextContent(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <div
          className={clsx(
            "flex items-center gap-m",
            isTextAreaExpanded && "self-end"
          )}
        >
          <IconButton
            variant="primary"
            icon={isRunning ?? false ? <StopCircle /> : <ArrowUp />}
            onClick={isRunning ?? false ? onCancel : handleSubmit}
            style={{ borderRadius: 10 }}
          />
        </div>
      </div>
    </div>
  );
};
