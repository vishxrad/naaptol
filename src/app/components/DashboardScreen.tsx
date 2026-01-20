import { ChatProvider } from "@crayonai/react-core";
import { useThreadListManager, useThreadManager } from "@thesysai/genui-sdk";
import { usePathname, useRouter } from "next/navigation";
import * as apiClient from "@/apiClient";
import { CopilotTray, CopilotTrayProps } from "./CopilotTray";

export const DashboardScreen = (props: CopilotTrayProps) => {
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
      <CopilotTray {...props} />
    </ChatProvider>
  );
};
