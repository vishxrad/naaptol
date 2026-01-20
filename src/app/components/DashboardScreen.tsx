import { ChatProvider } from "@crayonai/react-core";
import { useThreadListManager, useThreadManager } from "@thesysai/genui-sdk";
import { usePathname, useRouter } from "next/navigation";
import * as apiClient from "@/apiClient";
import { CopilotTray, CopilotTrayProps } from "./CopilotTray";
import { ReactNode } from "react";

interface DashboardScreenProps extends CopilotTrayProps {
  children?: ReactNode;
}

export const DashboardScreen = ({ children, ...props }: DashboardScreenProps) => {
  const pathname = usePathname();
  const { replace } = useRouter();

  const threadListManager = useThreadListManager({
    fetchThreadList: () => apiClient.getThreadList(),
    deleteThread: (threadId) => apiClient.deleteThread(threadId),
    updateThread: (t) => apiClient.updateThread(t),
    onSwitchToNew: () => {
      replace(`${pathname}`);
    },
    onSelectThread: (threadId) => {
      const newSearch = `?threadId=${threadId}`;
      replace(`${pathname}${newSearch}`);
    },
    createThread: (message) => {
      return apiClient.createThread(message.message!);
    },
  });

  const threadManager = useThreadManager({
    threadListManager,
    loadThread: (threadId) => apiClient.getMessages(threadId),
    onUpdateMessage: ({ message }) => {
      apiClient.updateMessage(threadListManager.selectedThreadId!, message);
    },
    apiUrl: "/api/chat",
  });

  return (
    <ChatProvider
      threadListManager={threadListManager}
      threadManager={threadManager}
    >
      <div className="relative w-full h-full overflow-hidden">
        {/* Main Content Area (StudentDashboard will go here) */}
        <div className="w-full h-full overflow-hidden">
          {children}
        </div>

        {/* Chat Overlay */}
        <div className="absolute bottom-0 left-0 w-full h-full pointer-events-none flex flex-col justify-end z-20">
          <CopilotTray {...props} />
        </div>
      </div>
    </ChatProvider>
  );
};