import { useState } from "react";
import { isFileTypeAllowed } from "@/constants/fileTypes";

interface UseFileDragOptions {
  onFilesDropped?: (files: File[]) => void;
}

export const useFileDrag = (options: UseFileDragOptions = {}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the composer area entirely
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);

    // Filter to only allow allowed file types
    const allowedFiles = droppedFiles.filter(isFileTypeAllowed);

    if (allowedFiles.length > 0 && options.onFilesDropped) {
      options.onFilesDropped(allowedFiles);
    }
  };

  return {
    isDragging,
    dragHandlers: {
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
};