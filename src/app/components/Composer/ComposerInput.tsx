import { IconButton } from "@crayonai/react-ui";
import { ArrowUp, Paperclip, StopCircle } from "lucide-react";
import React, { useRef, useState } from "react";
import { AttachedFile } from "./AttachedFile";
import { FileDragState } from "./FileDragState";
import clsx from "clsx";
import { useIsMobile } from "@/hooks/useIsMobile";

interface FileState {
  files: File[];
  totalFileSize: number;
  isAtSizeLimit: boolean;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleFilesDropped: (files: File[]) => void;
  removeFile: (index: number) => void;
}

interface DragState {
  isDragging: boolean;
  dragHandlers: {
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
}

interface ComposerInputProps {
  onSubmit: (text: string) => void;
  isRunning: boolean | undefined;
  onCancel: () => void;
  fileState: FileState;
  dragState: DragState;
  onClearFiles: () => void;
  inputContainerRef: React.RefObject<HTMLDivElement | null>;
}

export const ComposerInput = ({
  inputContainerRef,
  onSubmit,
  isRunning,
  onCancel,
  fileState,
  dragState,
  onClearFiles,
}: ComposerInputProps) => {
  const [textContent, setTextContent] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isTextAreaExpanded, setIsTextAreaExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile()

  const composerDisabled: boolean = Boolean(
    fileState.isAtSizeLimit || dragState.isDragging
  );

  const handleSubmit = async () => {
    if (!textContent.trim() || (isRunning ?? false)) {
      return;
    }

    onSubmit(textContent);
    onClearFiles();
    setTextContent("");
    if (textAreaRef.current) {
      // reset text area state
      textAreaRef.current.rows = 1;
      setIsTextAreaExpanded(false);
    }
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={clsx(
        "flex flex-col gap-m p-m border rounded-[18px] bg-container w-3/4 mx-auto",
        composerDisabled && "bg-sunk",
        !isFocused && "border-interactive-el",
        isFocused && "border-emphasis",
        dragState.isDragging && "border-[#1882FF] bg-container"
      )}
      {...dragState.dragHandlers}
      ref={inputContainerRef}
    >
      {(fileState.files.length > 0 || dragState.isDragging) && (
        <div className="flex flex-wrap gap-s max-h-[125px] overflow-y-auto">
          {fileState.files.map((file, index) => (
            <AttachedFile
              key={`${file.name}-${index}`}
              file={file}
              onRemove={() => fileState.removeFile(index)}
            />
          ))}
          {dragState.isDragging && (
            <FileDragState onClick={handleFileInputClick} />
          )}
        </div>
      )}

      {fileState.files.length > 0 && (
        <p className="flex self-end items-center justify-between text-xs text-secondary">
          <span className={clsx(fileState.isAtSizeLimit && "text-danger")}>
            {(fileState.totalFileSize / 1024).toFixed(1)}KB
          </span>
          <span className="ml-[0.5ch]">/ 300KB</span>
        </p>
      )}

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
          <div className="relative">
            <input
              type="file"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={fileState.handleFileChange}
              accept=".csv,.xlsx"
            />
            <IconButton
              variant="secondary"
              icon={<Paperclip />}
              onClick={(e) => {
                e.preventDefault();
                handleFileInputClick();
              }}
              disabled={composerDisabled}
              style={{ borderRadius: 10 }}
            />
          </div>
          <IconButton
            variant="primary"
            icon={isRunning ?? false ? <StopCircle /> : <ArrowUp />}
            onClick={isRunning ?? false ? onCancel : handleSubmit}
            disabled={!(isRunning ?? false) && composerDisabled}
            style={{ borderRadius: 10 }}
          />
        </div>
      </div>
    </div>
  );
};