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

export const CopilotTray = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const { messages } = useThreadState();
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
      className={clsx(
        "w-full md:w-5/12 h-full max-h-full flex flex-col bg-container overflow-hidden transition-all duration-300",
        groupedMessages.length === 0 &&
          "border-l border-default border-l-black/4",
        groupedMessages.length > 0 && "md:w-8/12"
      )}
    >
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
