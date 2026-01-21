"use client";

import { motion } from "framer-motion";
import { Landmark, ShieldCheck, Check } from "lucide-react";

export const BankLinkPopup = ({ onFinish }: { onFinish: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800"
      >
        <div className="relative h-32 bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center">
          <div className="absolute inset-0 bg-white/10" />
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center ring-4 ring-white/10">
            <Landmark className="w-8 h-8 text-white" />
          </div>
        </div>

        <div className="p-8 pt-6 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Connect Your Bank
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              This will allow the application to:
            </p>
          </div>

          <div className="space-y-4 px-2">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-green-100 dark:bg-green-900/30 p-1 rounded-full shrink-0">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900 dark:text-gray-100">Link your primary bank account</p>
                <p className="text-xs text-gray-500 mt-0.5">Read-only access to track expenses</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 bg-green-100 dark:bg-green-900/30 p-1 rounded-full shrink-0">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Access your location <span className="text-gray-500 font-normal">(United States)</span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Required for regional compliance</p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl flex items-start gap-3 text-left">
            <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-800 dark:text-indigo-300">
              Your data is encrypted and secure. We use read-only access to analyze your transactions.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={onFinish}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
            >
              Accept
            </button>
            <button
              onClick={onFinish}
              className="w-full py-3 px-4 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium rounded-xl transition-colors text-sm"
            >
              I'll do this later
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
