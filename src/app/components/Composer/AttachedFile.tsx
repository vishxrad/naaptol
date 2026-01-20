import { IconButton } from "@crayonai/react-ui";
import { TablePropertiesIcon, XIcon } from "lucide-react";

interface AttachedFileProps {
  file: File;
  onRemove: () => void;
}

export const AttachedFile: React.FC<AttachedFileProps> = ({
  file,
  onRemove,
}) => {
  return (
    <div className="flex p-s gap-s rounded-xl bg-container w-full md:min-w-[200px] md:max-w-[256px] border border-interactive-el">
      <div className="bg-[#47CD89] rounded-lg min-w-[36px] min-h-[36px] max-w-[36px] max-h-[36px] flex items-center justify-center">
        <TablePropertiesIcon size={14} color="white" />
      </div>
      <div className="flex flex-col justify-between flex-1">
        <p className="text-sm text-primary line-clamp-1">{file.name}</p>
        <p className="text-xs text-secondary">{getFileTypeText(file)}</p>
      </div>
      <IconButton
        icon={<XIcon size={12} />}
        onClick={onRemove}
        variant="secondary"
        size="extra-small"
        className="min-w-[20px] min-h-[20px] max-w-[20px] max-h-[20px]"
      />
    </div>
  );
};

const getFileTypeText = (file: File) => {
  switch (file.type) {
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return "Spreadsheet";
    case "text/csv":
      return "CSV";
    default:
      return "Unknown";
  }
};