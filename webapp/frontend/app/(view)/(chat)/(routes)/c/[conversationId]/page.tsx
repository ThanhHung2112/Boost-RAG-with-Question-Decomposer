"use client";

import { useEffect } from "react";

import ChatBotLoader from "./_components/chatbot-loader";

import { reactQueryClient } from "@/services/react-query.service";

const ConversationIdPage = () => {
  const handleRefresh = () => {
    const queryKeys = [
      ["getTemporaryFiles"],
      ["getHistoryFilesByConversations"],
      ["getHistoryHyperlinksByConversation"],
    ];

    queryKeys.forEach((queryKey) => {
      reactQueryClient.invalidateQueries({ queryKey });
    });
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  return <ChatBotLoader />;
};

export default ConversationIdPage;
