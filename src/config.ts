import type { Suggestion } from "./app/components/Composer/Suggestions";

type Config = {
  /**
   * The prompt suggestions to show during the zero state when the user has yet to interact with the agent / copilot.
   */
  prefilledSuggestions?: Suggestion[];
};

export const config: Config = {
  prefilledSuggestions: [
    {
      text: "How do I recover from my overspending last month?",
      type: "explain",
    },
    {
      text: "Can you help me find ways to save more effectively?",
      type: "investigate",
    },
    {
      text: "Sanitize my spending so i can send it to my dad",
      type: "analyze",
    },
  ],
};
