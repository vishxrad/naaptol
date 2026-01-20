import { ArrowRight, BadgePercent, TrendingUp, Users } from "lucide-react";
import clsx from "clsx";
import { useState, useEffect } from "react";
import { m } from "framer-motion";

export type Suggestion = {
  text: string;
  type: "investigate" | "analyze" | "explain";
  title?: string;
};

interface SuggestionsProps {
  suggestions: Suggestion[];
  collapsed?: boolean;
  executePrompt: (prompt: string) => void;
  pushQueryTitle: (title: string) => void;
  inputContainerRef?: React.RefObject<HTMLElement | null>;
}

export const Suggestions = ({
  suggestions,
  executePrompt,
  pushQueryTitle,
  inputContainerRef,
}: SuggestionsProps) => {
  const [bottomPosition, setBottomPosition] = useState(125); // fallback percentage

  useEffect(() => {
    if (!inputContainerRef?.current) return;

    const updatePosition = () => {
      const containerHeight =
        inputContainerRef.current!.getBoundingClientRect().height;
      setBottomPosition(containerHeight + 12); // container height + 12px
    };

    updatePosition();

    // Update position when window resizes or container might change
    const resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(inputContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [inputContainerRef]);

  const suggestionClickHandler = (queryText: string, queryTitle?: string) => {
    pushQueryTitle(queryTitle ?? queryText);
    executePrompt(queryText);
  };

  return (
    <m.div
      className="flex flex-row gap-s absolute z-10 w-3/4 left-1/2 -translate-x-1/2"
      style={{ bottom: `${bottomPosition}px` }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
    >
      {suggestions.map((suggestion) => (
        <Suggestion
          key={suggestion.text}
          {...suggestion}
          suggestionClickHandler={suggestionClickHandler}
        />
      ))}
    </m.div>
  );
};

interface SuggestionProps {
  title?: string;
  text: string;
  type: "investigate" | "analyze" | "explain";
  suggestionClickHandler: (queryText: string, queryTitle?: string) => void;
}

const Suggestion = ({
  title,
  text,
  type,
  suggestionClickHandler,
}: SuggestionProps) => {
  return (
    <div
      className="flex-1 h-20 p-m flex flex-col justify-between border border-interactive-el rounded-2xl shadow-sm hover:shadow-md hover:border-interactive-el-hover cursor-pointer bg-container transition-all duration-200 hover:-translate-y-1"
      onClick={() => {
        suggestionClickHandler(text, title);
      }}
    >
      <div className="p-2 rounded-lg bg-sunk w-fit">
        {type === "investigate" && (
          <TrendingUp className="text-blue-500" size={20} />
        )}
        {type === "analyze" && <Users className="text-orange-500" size={20} />}
        {type === "explain" && (
          <BadgePercent className="text-pink-500" size={20} />
        )}
      </div>

      <span className="text-primary text-sm font-medium line-clamp-3 leading-snug">
        {text}
      </span>
    </div>
  );
};
