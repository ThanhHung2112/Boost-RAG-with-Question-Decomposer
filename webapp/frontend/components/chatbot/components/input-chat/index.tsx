"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { ButtonSendMessage } from "./components";

import { useChatbotContext } from "@/contexts/chatbot.provider";
import { useDraftMessagesContext } from "@/contexts/draft-message.provider";

export const InputChat = () => {
  const router = useRouter();

  const {
    onSendMessage,
    setTextMessage,
    textMessage,
    stateResponse,
    newConversationId,
    resetNewConversationId,
  } = useChatbotContext();

  const { addDraftMessage, updateDraftMessageStatus, removeDraftMessage } =
    useDraftMessagesContext();

  useEffect(() => {
    if (newConversationId) {
      setTextMessage("");
      router.push(`/c/${newConversationId}`);

      const timeoutId = setTimeout(() => {
        resetNewConversationId();
      }, 3000);

      return () => clearTimeout(timeoutId);
    }
  }, [newConversationId, router, setTextMessage, resetNewConversationId]);

  const handleSendMessage = () => {
    if (textMessage.trim().length > 0) {
      const draftId = uuidv4();
      const conversationId = newConversationId || "default";

      addDraftMessage({
        id: draftId,
        conversationId,
        context: textMessage.trim(),
        sender: "client",
        status: "pending",
      });

      onSendMessage()
        .then(() => {
          removeDraftMessage(conversationId, draftId);
        })
        .catch(() => {
          updateDraftMessageStatus(conversationId, draftId, "failed");
        });

      setTextMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !stateResponse) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const buttonProps = {
    textMessage,
    onSendMessage: handleSendMessage,
    stateResponse,
  };

  return (
    <div className="bg-white w-full px-4 py-2 flex items-center space-x-3 rounded-lg">
      <div className="flex items-center bg-gray-100 w-full rounded-full space-x-2 px-3">
        <textarea
          className="text-area flex-grow p-3 resize-none outline-none bg-gray-100 text-sm rounded-full"
          placeholder="Message Chat Assistance"
          rows={1}
          value={textMessage}
          onChange={(e) => setTextMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <ButtonSendMessage {...buttonProps} />
      </div>
    </div>
  );
};
