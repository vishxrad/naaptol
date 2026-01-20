import { UploadIcon } from "lucide-react";

interface FileEmptyStateProps {
  onClick: () => void;
}

export const FileDragState = ({ onClick }: FileEmptyStateProps) => {
  return (
    <div
      className="flex items-center gap-s rounded-xl border border-[#1882FF] border-dashed p-s max-w-[256px] cursor-pointer bg-container"
      onClick={onClick}
    >
      <div className="flex items-center justify-center rounded-lg bg-sunk w-[36px] h-[36px] text-primary">
        <UploadIcon size={14} />
      </div>
      <p className="text-primary font-medium text-sm">
        Dropped files appear here
      </p>
    </div>
  );
};