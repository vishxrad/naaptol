import React from "react";
import { Sparkles } from "lucide-react";

export const WelcomeCard = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center pb-32">
      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20 animate-in fade-in zoom-in duration-500">
        <Sparkles className="text-white w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 animate-in slide-in-from-bottom-2 duration-700 fade-in fill-mode-backwards delay-100">
        Hey, how can I help you?
      </h2>
      {/* <p className="text-gray-500 dark:text-gray-400 max-w-xs animate-in slide-in-from-bottom-2 duration-700 fade-in fill-mode-backwards delay-200">
        I'm here to assist with your analytics and questions.
      </p> */}
    </div>
  );
};
