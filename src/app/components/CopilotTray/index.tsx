import { m } from "framer-motion";
import clsx from "clsx";
import Header from "../Header";
import { Composer } from "../Composer";
import {
  useThreadState,
  type AssistantMessage,
  type UserMessage,
} from "@crayonai/react-core";
import { WelcomeCard } from "../WelcomeCard";
import { useEffect, useState } from "react";
import { MessageGroup } from "./MessageGroup";
import "@/custom.css";

import { ChevronLeft } from "lucide-react";

export interface CopilotTrayProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const CopilotTray = ({
  isCollapsed = false,
  onToggleCollapse,
}: CopilotTrayProps) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const { messages = [] } = useThreadState();
  const [queryTitles, setQueryTitles] = useState<string[]>([]);

  const groupedMessages: {
    userMessage: UserMessage;
    assistantMessage?: AssistantMessage;
  }[] = [];

  for (let i = 0; i < messages.length; i += 2) {
    const messageGroup = {
      userMessage: messages[i] as UserMessage,
      assistantMessage: messages[i + 1] as AssistantMessage,
    };
    groupedMessages.push(messageGroup);
  }

  // Update current index when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setCurrentMessageIndex(groupedMessages.length - 1);
    }
  }, [groupedMessages.length, messages.length]);

  const currentQueryTitle = queryTitles[currentMessageIndex];

  const pushQueryTitle = (title: string) => {
    setQueryTitles((prev) => [...prev, title]);
  };

  const currentMessageGroup = groupedMessages[currentMessageIndex];

  if (isCollapsed) {
    return (
      <div
        className="w-12 h-full border-l border-default bg-container flex flex-col items-center py-4 cursor-pointer hover:bg-hover transition-colors pointer-events-auto"
        onClick={onToggleCollapse}
      >
        <ChevronLeft size={24} className="text-secondary" />
        <div className="mt-4 [writing-mode:vertical-rl] text-secondary font-medium tracking-wide">
          StudentFin Copilot
        </div>
      </div>
    );
  }

  return (
    <m.div
      className={clsx(
        "relative w-full md:w-5/12 h-full max-h-full flex flex-col bg-container overflow-hidden transition-all duration-300 pointer-events-auto",
        groupedMessages.length === 0 &&
          "border-l border-default border-l-black/4",
        groupedMessages.length > 0 && "md:w-8/12"
      )}
    >
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="absolute top-1/2 -left-3 z-50 bg-container border border-default rounded-full p-1 shadow-md hover:bg-hover hidden md:block"
        >
          <ChevronLeft size={16} className="rotate-180" />
        </button>
      )}
      <Header
        canGoToNext={
          groupedMessages.length > 0 &&
          currentMessageIndex < groupedMessages.length - 1
        }
        goToNext={() => setCurrentMessageIndex((curr) => curr + 1)}
        canGoToPrevious={groupedMessages.length > 0 && currentMessageIndex > 0}
        goToPrevious={() => setCurrentMessageIndex((curr) => curr - 1)}
      />

      {groupedMessages.length === 0 ? (
        <WelcomeCard />
      ) : (
        <div className="flex-1 min-h-0 overflow-auto py-l px-xl flex flex-col gap-xl pb-[108px]">
          <MessageGroup
            queryTitle={currentQueryTitle}
            userMessage={currentMessageGroup?.userMessage}
            assistantMessage={currentMessageGroup?.assistantMessage}
          />
        </div>
      )}

      <div className="p-xl bg-none">
        <Composer pushQueryTitle={pushQueryTitle} />
      </div>
    </m.div>
  );
};
