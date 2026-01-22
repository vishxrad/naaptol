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
      className="flex-1 p-4 flex flex-col gap-3 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 cursor-pointer bg-white dark:bg-gray-800 transition-all duration-200 hover:-translate-y-1"
      onClick={() => {
        suggestionClickHandler(text, title);
      }}
    >
      <div className={clsx("p-2 rounded-xl w-fit", 
        type === "investigate" ? "bg-blue-50 dark:bg-blue-900/20" : 
        type === "analyze" ? "bg-orange-50 dark:bg-orange-900/20" : 
        "bg-pink-50 dark:bg-pink-900/20" 
      )}>
        {type === "investigate" && (
          <TrendingUp className="text-blue-600 dark:text-blue-400" size={20} />
        )}
        {type === "analyze" && <Users className="text-orange-600 dark:text-orange-400" size={20} />}
        {type === "explain" && (
          <BadgePercent className="text-pink-600 dark:text-pink-400" size={20} />
        )}
      </div>

      <span className="text-gray-700 dark:text-gray-200 text-sm font-medium line-clamp-2 leading-relaxed">
        {text}
      </span>
    </div>
  );
};
