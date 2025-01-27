import { Divider } from "@nextui-org/react";
import dynamic from "next/dynamic";

import { HistoryConversations } from "../history-conversations";

import { LazyLoading } from "@/components/lazyloading";

const ChatTabs = dynamic(
  () =>
    import("@/components/chatbot/components/chat-tabs").then(
      (mod) => mod.ChatTabs,
    ),
  {
    ssr: false,
    loading: () => <LazyLoading />,
  },
);

export const MainSlidebar = () => {
  return (
    <div className="flex flex-col h-[calc(100%-100px)]">
      <div>
        <h6 className="text-sm font-bold dark:text-white my-3">Latest chat</h6>
      </div>
      <div className="h-[200px] overflow-y-auto space-y-2 scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
        <HistoryConversations />
      </div>
      <div className="flex-shrink-0 mt-2">
        <Divider />
        <ChatTabs />
      </div>
    </div>
  );
};
