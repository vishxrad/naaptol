"use client";

import { ThemeProvider } from "@crayonai/react-ui";
import "@crayonai/react-ui/styles/index.css";
import { StudentDashboard } from "./components/StudentDashboard";
import { domAnimation, LazyMotion } from "framer-motion";
import Image from "next/image";
import { useTheme } from "./hooks/useTheme";
import { useState } from "react";
import dynamic from "next/dynamic";

const DashboardScreen = dynamic(
  () =>
    import("./components/DashboardScreen").then((mod) => mod.DashboardScreen),
  { ssr: false }
);

export interface CardInfo {
  text: string; // card prompt
}

export default function Home() {
  const theme = useTheme();
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  return (
    <LazyMotion features={domAnimation}>
      <ThemeProvider
        mode={theme}
        theme={{ defaultChartPalette: ["#4F46E5", "#7F56D9", "#1882FF"] }}
      >
        <div className="flex flex-col h-full w-full max-h-screen">
          <div className="relative w-full h-full max-h-full overflow-hidden">
            <div className="hidden md:flex flex-col w-full h-full overflow-hidden pr-12">
               <StudentDashboard />
            </div>
            <div className="absolute top-0 right-0 h-full w-full pointer-events-none flex justify-end z-20">
              <DashboardScreen
                isCollapsed={isChatCollapsed}
                onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)}
              />
            </div>
          </div>
        </div>
      </ThemeProvider>
    </LazyMotion>
  );
}
