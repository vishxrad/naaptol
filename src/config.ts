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
      text: "Analyze my spending patterns over the last 6 months comparend to an average student",
      type: "analyze",
    },
    {
      text: "Compare my rent cost to an apartment in Mumbai",
      type: "explain",
    },
    {
      text: "How much did I spend on food deliveries vs. dine in?",
      type: "investigate",
    },
  ],
};
