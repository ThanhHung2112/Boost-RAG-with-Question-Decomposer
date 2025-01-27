import { useEffect, useRef } from "react";

import { ChatLoading } from "../chat-loading";
import { Message } from "../message";

import { IMessageList } from "./interfaces";

import { useGetMessages } from "@/hooks/useGetMessages";
import { useDraftMessagesContext } from "@/contexts/draft-message.provider";
import { LazyLoading } from "@/components/lazyloading";

export const MessageList = ({
  conversationId,
  stateResponse,
}: IMessageList) => {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const {
    data: messages,
    isLoading: isMessageLoading,
    isError: isMessageError,
  } = useGetMessages(conversationId);

  const { draftMessages } = useDraftMessagesContext();

  const combinedMessages = [
    ...(Array.isArray(messages) ? messages : []),
    ...(draftMessages[conversationId] || []),
  ];

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [combinedMessages]);

  if (isMessageError) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        <p>Failed to load messages. Please try again later.</p>
      </div>
    );
  }

  if (isMessageLoading) {
    return (
      <div className="flex flex-col space-y-4 h-full text-gray-500">
        <LazyLoading />
      </div>
    );
  }

  return (
    <ul className="p-5 overflow-y-auto scroll-smooth no-scrollbar h-[calc(100%)]">
      {combinedMessages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p>No messages to display.</p>
        </div>
      ) : (
        combinedMessages.map((message: any, index: number) => (
          <li key={message.id}>
            <Message
              context={message.context}
              dialogueOrder={index}
              type={message.sender}
            />
          </li>
        ))
      )}
      <div ref={messagesEndRef} />
      {stateResponse && <ChatLoading />}
    </ul>
  );
};
