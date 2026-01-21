"use client";

import { ThemeProvider } from "@crayonai/react-ui";
import "@crayonai/react-ui/styles/index.css";
import { domAnimation, LazyMotion, AnimatePresence } from "framer-motion";
import { useTheme } from "./hooks/useTheme";
import { useState } from "react";
import dynamic from "next/dynamic";
import { SplashScreen } from "./components/SplashScreen";
import { BankLinkPopup } from "./components/BankLinkPopup";

// Dynamic import with SSR disabled to handle browser-only APIs
const DashboardScreen = dynamic(
  () =>
    import("./components/DashboardScreen").then((mod) => mod.DashboardScreen),
  { ssr: false }
);

// Dynamic import for StudentDashboard to prevent SSR issues
const StudentDashboard = dynamic(
  () => import('./components/StudentDashboard').then((mod) => mod.StudentDashboard),
  { ssr: false }
);

export default function Home() {
  const theme = useTheme();
  const [isChatCollapsed, setIsChatCollapsed] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [showBankPopup, setShowBankPopup] = useState(false);

  return (
    <LazyMotion features={domAnimation}>
      <ThemeProvider
        mode={theme as "light" | "dark"}
        theme={{ defaultChartPalette: ["#4F46E5", "#7F56D9", "#1882FF"] }}
      >
        <AnimatePresence mode="wait">
          {showSplash && (
            <SplashScreen
              key="splash"
              onFinish={() => {
                setShowSplash(false);
                setShowBankPopup(true);
              }}
            />
          )}
          {showBankPopup && (
            <BankLinkPopup key="bank-popup" onFinish={() => setShowBankPopup(false)} />
          )}
        </AnimatePresence>

        <div className="flex flex-col h-full w-full max-h-screen">
          <div className="relative w-full h-full max-h-full overflow-hidden">
             {/* DashboardScreen now acts as the Wrapper & Layout Provider */}
             <DashboardScreen
                isCollapsed={isChatCollapsed}
                onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)}
              >
                {/* StudentDashboard is passed as a child, so it has access to Chat Context */}
                <StudentDashboard 
                  onOpenChat={() => setIsChatCollapsed(false)} 
                />
             </DashboardScreen>
          </div>
        </div>
      </ThemeProvider>
    </LazyMotion>
  );
}