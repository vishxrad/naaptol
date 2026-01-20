import { useState } from "react";
import { MAX_TOTAL_FILE_SIZE, isFileTypeAllowed } from "@/constants/fileTypes";

export const useFileHandler = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [totalFileSize, setTotalFileSize] = useState<number>(0);

  const generateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    // Filter to only allow allowed file types
    const allowedFiles = selectedFiles.filter(isFileTypeAllowed);

    // Generate hashes for existing files
    const existingHashes = new Set<string>();
    for (const file of files) {
      const hash = await generateFileHash(file);
      existingHashes.add(hash);
    }

    // Filter out duplicates
    const uniqueFiles: File[] = [];
    for (const file of allowedFiles) {
      const hash = await generateFileHash(file);
      if (!existingHashes.has(hash)) {
        uniqueFiles.push(file);
        existingHashes.add(hash);
      }
    }

    // Calculate size of unique files and check limit
    const uniqueFilesSize = uniqueFiles.reduce(
      (total, file) => total + file.size,
      0
    );

    setFiles((prevFiles) => [...prevFiles, ...uniqueFiles]);
    setTotalFileSize((prevSize) => prevSize + uniqueFilesSize);
  };

  const handleFilesDropped = async (droppedFiles: File[]) => {
    // Filter to only allow allowed file types (already done in useFileDrag, but being safe)
    const allowedFiles = droppedFiles.filter(isFileTypeAllowed);

    // Create a synthetic event object to reuse existing logic
    const syntheticEvent = {
      target: { files: allowedFiles },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await handleFileChange(syntheticEvent);
  };

  const removeFile = (indexToRemove: number) => {
    const fileToRemove = files[indexToRemove];
    if (fileToRemove) {
      setTotalFileSize((prevSize) => prevSize - fileToRemove.size);
    }
    setFiles((prevFiles) =>
      prevFiles.filter((_, index) => index !== indexToRemove)
    );
  };

  const clearFiles = () => {
    setFiles([]);
    setTotalFileSize(0);
  };

  const processFiles = async (
    processFunction: (file: File) => Promise<unknown>
  ) => {
    const contexts: unknown[] = [];

    for (const file of files) {
      try {
        const result = await processFunction(file);
        contexts.push(result);
      } catch (error) {
        console.error("Error processing file:", error);
        // Continue with other files
      }
    }

    return contexts;
  };

  return {
    files,
    totalFileSize,
    handleFileChange,
    handleFilesDropped,
    removeFile,
    clearFiles,
    processFiles,
    isAtSizeLimit: totalFileSize >= MAX_TOTAL_FILE_SIZE,
  };
};