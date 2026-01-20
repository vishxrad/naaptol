"use client";

import { motion, Variants, AnimatePresence } from "framer-motion"; // Import AnimatePresence
import { useEffect, useState } from "react";

export const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  // 1. Internal state to control the exit phase
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 2. Wait for the loading sequence (3.5s), then trigger the exit animation
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3500);

    return () => clearTimeout(timer);
  }, []); // Empty dependency array ensures this runs once on mount

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
    exit: {
      opacity: 0,
      scale: 1.1,
      filter: "blur(10px)",
      transition: { duration: 0.8, ease: "easeInOut" },
    },
  };

  const logoContainerVariants: Variants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        duration: 1,
      },
    },
  };

  const textContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.8,
      },
    },
  };

  const letterVariants: Variants = {
    hidden: { y: 20, opacity: 0, filter: "blur(10px)" },
    visible: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { type: "spring", damping: 12, stiffness: 100 },
    },
  };

  const title = "";

  return (
    // 3. Wrap in AnimatePresence to enable the 'exit' prop
    // onExitComplete fires when the exit animation finishes
    <AnimatePresence onExitComplete={onFinish}>
      {isVisible && (
        <motion.div
          key="splash-screen" // Key is required for AnimatePresence
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background overflow-hidden"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Ambient Background Glow */}
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[120px]"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
          <motion.div
            className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 3, delay: 0.5 }}
          />

          <div className="flex flex-col items-center gap-10 relative z-10 p-8">
            <motion.div
              variants={logoContainerVariants}
              className="relative w-48 h-48 drop-shadow-2xl"
            >
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                <defs>
                  <linearGradient
                    id="paint0_linear_splash"
                    x1="3.12468"
                    y1="2.88011"
                    x2="24.4455"
                    y2="39.8195"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#AB9AFF" />
                    <stop offset="1" stopColor="#646BFF" />
                  </linearGradient>
                </defs>
                <motion.rect
                  width="36"
                  height="36"
                  rx="12"
                  fill="url(#paint0_linear_splash)"
                  initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ duration: 1.2, type: "spring", bounce: 0.4 }}
                />
                <motion.path
                  d="M17.3227 11.6765V18L15.876 17.1765C13.3074 15.7059 11.713 12.9706 11.713 10H10.6501V17.2353C10.6501 19.5882 12.0083 21.7647 14.1636 22.7941L17.3522 24.3235V18L18.7989 18.8235C21.3675 20.2941 22.9619 23.0294 22.9619 26H24.0248V18.7647C24.0248 16.4118 22.6666 14.2353 20.5113 13.2059L17.3227 11.6765Z"
                  stroke="white"
                  strokeWidth="0.8"
                  fill="white"
                  fillOpacity={0}
                  initial={{ pathLength: 0, fillOpacity: 0 }}
                  animate={{
                    pathLength: 1,
                    fillOpacity: 1,
                  }}
                  transition={{
                    pathLength: { delay: 0.5, duration: 1.5, ease: "easeInOut" },
                    fillOpacity: { delay: 1.8, duration: 0.8 },
                  }}
                />
              </svg>
            </motion.div>

            <div className="flex flex-col items-center gap-4">
              {/* 4. Fix Accessibility: Add aria-label and hide the split characters */}
              <motion.div
                variants={textContainerVariants}
                className="flex flex-wrap justify-center overflow-hidden gap-x-[1px]"
                aria-label={title} 
              >
                {title.split("").map((char, index) => (
                  <motion.span
                    key={index}
                    variants={letterVariants}
                    aria-hidden="true"
                    className="text-4xl md:text-5xl font-bold font-sans tracking-tight text-foreground/90"
                    style={{
                      whiteSpace: "pre",
                      textShadow: "0 0 40px rgba(100, 107, 255, 0.2)",
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2, duration: 0.8 }}
                className="text-muted-foreground text-sm font-medium tracking-widest uppercase opacity-60"
              >
                Loading Dashboard
              </motion.div>
            </div>

            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-64 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-400 via-purple-500 to-indigo-400"
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ delay: 0.5, duration: 3, ease: "circOut" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};