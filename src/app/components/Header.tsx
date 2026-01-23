import React from "react";
import { IconButton } from "@crayonai/react-ui";
import { ArrowRight, ArrowLeft, ChevronDown } from "lucide-react";
import Image from "next/image";

interface HeaderProps {
  canGoToNext: boolean;
  goToNext: () => void;
  canGoToPrevious: boolean;
  goToPrevious: () => void;
  onClose?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  canGoToNext,
  goToNext,
  canGoToPrevious,
  goToPrevious,
  onClose,
}) => {
  return (
    <div className="flex justify-between items-center p-m border-b border-default">
      <div className="flex items-center gap-s">
        <Image
          src="/agent-logo.svg"
          alt="ForexFriend Copilot"
          width={36}
          height={36}
        />
        <p className="text-md text-primary">
          ForexFriend <span className="text-secondary">Copilot</span>
        </p>
      </div>

      <div className="flex items-center gap-s">
        <IconButton
          variant="secondary"
          size="large"
          icon={<ArrowLeft />}
          disabled={!canGoToPrevious}
          onClick={goToPrevious}
        />
        <IconButton
          variant="secondary"
          size="large"
          icon={<ArrowRight />}
          disabled={!canGoToNext}
          onClick={goToNext}
        />
        {onClose && (
          <div className="hidden md:flex items-center">
            <div className="w-px h-6 bg-default mx-2" />
            <IconButton
              variant="secondary"
              size="large"
              icon={<ChevronDown />}
              onClick={onClose}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
