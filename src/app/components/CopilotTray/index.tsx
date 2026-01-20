import { m, AnimatePresence } from "framer-motion";
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

import { Sparkles, Command, ArrowUp } from "lucide-react";

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

  return (
    <m.div
      layout
      className={clsx(
        "relative flex flex-col overflow-hidden transition-all duration-500 ease-in-out pointer-events-auto z-50",
        isCollapsed
          ? "h-24 bg-transparent w-full pointer-events-none" // Height matches button area, transparent so clicks pass through elsewhere
          : "h-full w-full bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-2xl"
      )}
    >
      {isCollapsed ? (
        /* --- Floating Command Capsule --- */
        <div className="absolute bottom-6 left-0 right-0 px-4 flex justify-center pointer-events-auto">
          <button
            onClick={onToggleCollapse}
            className="group relative flex items-center gap-3 w-3/4 h-14 pl-5 pr-4 
                       bg-white dark:bg-zinc-800 
                       border border-zinc-200 dark:border-zinc-700 
                       rounded-full shadow-xl hover:shadow-2xl 
                       transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] active:scale-[0.98]"
          >
            {/* AI Icon with Gradient Pulse */}
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shrink-0">
               <Sparkles className="text-white w-4 h-4" />
            </div>

            {/* Text Content */}
            <div className="flex flex-col items-start flex-1 overflow-hidden">
              <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                Ask Copilot
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                Analyze data, summarize info, or draft content...
              </span>
            </div>

            {/* Shortcut Badge */}
            <div className="hidden sm:flex items-center gap-1 pl-2 pr-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 shrink-0">
                <Command size={10} className="text-zinc-500 dark:text-zinc-400" />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">K</span>
            </div>
            
            {/* Mobile Arrow Hint */}
            <div className="sm:hidden text-zinc-400">
                <ArrowUp size={16} />
            </div>
          </button>
        </div>
      ) : (
        /* --- Expanded Chat Interface --- */
        <>
          <Header
            canGoToNext={
              groupedMessages.length > 0 &&
              currentMessageIndex < groupedMessages.length - 1
            }
            goToNext={() => setCurrentMessageIndex((curr) => curr + 1)}
            canGoToPrevious={
              groupedMessages.length > 0 && currentMessageIndex > 0
            }
            goToPrevious={() => setCurrentMessageIndex((curr) => curr - 1)}
            onClose={onToggleCollapse}
          />

          {groupedMessages.length === 0 ? (
            <div className="flex-1 min-h-0">
              <WelcomeCard />
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto py-6 px-4 md:px-8 flex flex-col gap-8 pb-32">
              <MessageGroup
                queryTitle={currentQueryTitle}
                userMessage={currentMessageGroup?.userMessage}
                assistantMessage={currentMessageGroup?.assistantMessage}
              />
            </div>
          )}

          <div className="p-4 bg-white dark:bg-zinc-900">
            <Composer pushQueryTitle={pushQueryTitle} />
          </div>
        </>
      )}
    </m.div>
  );
};