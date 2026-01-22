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
        "flex flex-col gap-3 p-3 border rounded-3xl w-3/4 mx-auto transition-all duration-200",
        "bg-white dark:bg-gray-800 shadow-sm",
        composerDisabled && "bg-gray-50 dark:bg-gray-900/50 opacity-50 cursor-not-allowed",
        !isFocused && "border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800",
        isFocused && "border-indigo-500 ring-1 ring-indigo-500 dark:border-indigo-400 dark:ring-indigo-400",
        dragState.isDragging && "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 border-dashed"
      )}
      {...dragState.dragHandlers}
      ref={inputContainerRef}
    >
      {(fileState.files.length > 0 || dragState.isDragging) && (
        <div className="flex flex-wrap gap-2 max-h-[125px] overflow-y-auto px-1">
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
        <p className="flex self-end items-center justify-between text-xs text-gray-400 dark:text-gray-500 px-1">
          <span className={clsx(fileState.isAtSizeLimit && "text-red-500")}>
            {(fileState.totalFileSize / 1024).toFixed(1)}KB
          </span>
          <span className="ml-[0.5ch]">/ 300KB</span>
        </p>
      )}

      <div
        className={clsx(
          "flex gap-2",
          !isTextAreaExpanded && "items-center justify-between",
          isTextAreaExpanded && "flex-col"
        )}
      >
        <textarea
          ref={textAreaRef}
          rows={1}
          placeholder="Ask anything about your spending..."
          className={clsx(
            "flex-1 pl-2 outline-none resize-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 min-h-[40px] py-2",
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
            "flex items-center gap-2 pr-1",
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
            <button
               onClick={(e) => {
                e.preventDefault();
                handleFileInputClick();
              }}
              disabled={composerDisabled}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Paperclip size={20} />
            </button>
          </div>
          <button
            onClick={isRunning ?? false ? onCancel : handleSubmit}
            disabled={!(isRunning ?? false) && composerDisabled}
            className={clsx(
               "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
               (textContent.trim() || (isRunning ?? false))
                 ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0" 
                 : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
            )}
          >
            {isRunning ?? false ? <StopCircle size={20} /> : <ArrowUp size={22} strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    </div>
  );
};