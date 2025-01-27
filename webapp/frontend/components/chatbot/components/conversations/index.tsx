"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";

import { InputChat } from "../input-chat";

import { LazyLoading } from "@/components/lazyloading";
import { getDataSession } from "@/states/session/dataSession";
import { useChatbotContext } from "@/contexts/chatbot.provider";

const MessageList = dynamic(
  () => import("./components/message-list").then((mod) => mod.MessageList),
  {
    loading: () => <LazyLoading />,
  },
);

export const Conversations = ({
  conversationId,
}: {
  conversationId: string;
}) => {
  const { stateResponse, setStateResponse } = useChatbotContext();

  useEffect(() => {
    const sessionKey =
      process.env.NEXT_PUBLIC_KEY_SESSION_JOB || "hisHyperlink";
    let sessionData = getDataSession(sessionKey) || [];
    let messageTemp = getDataSession(conversationId);

    const conversationIndex = sessionData.findIndex(
      (entry: any) => entry.conversationId === conversationId,
    );

    if (conversationIndex !== -1 || messageTemp) {
      setStateResponse(true);
    } else {
      setStateResponse(false);
    }
  }, [conversationId, stateResponse]);

  return (
    <div className="w-full h-[calc(100vh-64px)] dark:bg-white transition-transform">
      <MessageList
        conversationId={conversationId}
        stateResponse={stateResponse}
      />
      <div className="w-full bottom-0 flex items-center bg-white">
        <InputChat />
      </div>
    </div>
  );
};
