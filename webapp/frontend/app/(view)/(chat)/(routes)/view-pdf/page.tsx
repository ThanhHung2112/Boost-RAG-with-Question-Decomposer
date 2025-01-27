"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { FaArrowCircleUp, FaMicrophone } from "react-icons/fa";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";

import { Card } from "./_components";
import { cards } from "./_constants";

import { LazyLoading } from "@/components/lazyloading";
import { IMessage } from "@/components/chatbot/components/conversations/interfaces";
import { formatDateTime } from "@/lib";
import { useToastMessage } from "@/hooks/useToastMessage";
import { useNewConversations } from "@/hooks/useNewConversations";
import { useSnapshotData } from "@/hooks/useSnapshotData";
import { saveDataToSession } from "@/states/session/dataSession";
import { useGetNameConversations } from "@/hooks/useGetNameConversastions";

const ChatBot = dynamic(
  () => import("@/components/chatbot").then((mod) => mod.ChatBot),
  {
    ssr: false,
    loading: () => <LazyLoading />,
  },
);

const ConversationPage = () => {
  const [messageText, setMessageText] = useState("");
  const router = useRouter();
  const { toast } = useToastMessage();

  const { mutate: createConversation } = useNewConversations();
  const { mutate: updateSnapshotData } = useSnapshotData();
  const { mutate: updateConversationNames } = useGetNameConversations();

  const isMessageEmpty = messageText.trim() === "";

  const handleNewChat = async () => {
    if (isMessageEmpty) return;

    const newConversationId = uuidv4();
    const formattedDateTime = formatDateTime(new Date());
    const userMessage: IMessage = {
      id: uuidv4(),
      conversationId: newConversationId,
      clientId: uuidv4(),
      context: messageText,
      sender: "client",
      createdTime: formattedDateTime,
    };

    try {
      createConversation(userMessage, {
        onSuccess: async () => {
          setMessageText("");
          router.push(`/c/${newConversationId}`);

          try {
            await Promise.all([
              updateConversationNames({
                conversationId: newConversationId,
                contextMessage: userMessage.context,
              }),
              saveDataToSession(newConversationId, {
                messageText: userMessage.context,
              }),
              updateSnapshotData(newConversationId),
            ]);
            console.log("All operations completed successfully.");
          } catch (error) {
            console.error("An error occurred during operations:", error);
          }
        },
        onError: (error) =>
          handleError(error, "Failed to create conversation."),
      });
    } catch (error) {
      handleError(error, "An unexpected error occurred.");
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleNewChat();
    }
  };

  const handleError = (error: unknown, defaultMessage: string) => {
    console.error("Error:", error);
    toast.error(error instanceof Error ? error.message : defaultMessage);
  };

  return (
    <>
      <div className="w-full bg-white h-[calc(100vh-50px)] flex flex-col justify-center items-center bg-gray-100 dark:bg-gray-800 p-6 space-y-8 transition-all">
        <div className="flex justify-center mb-4">
          <span className="self-center font-semibold text-gray-300 text-3xl">
            {process.env.NEXT_PUBLIC_APP_NAME || "AI Chat App"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <Card
              key={index}
              description={card.description}
              title={card.title}
            />
          ))}
        </div>
      </div>

      <div className="w-full bottom-0 flex items-center h-[40px]">
        <div className="bg-white w-full px-4 py-2 flex items-center space-x-3 rounded-lg">
          <div className="flex items-center bg-gray-100 w-full rounded-full space-x-2 px-3">
            <textarea
              aria-label="Message input"
              className="flex-grow p-3 resize-none outline-none bg-gray-100 text-sm rounded-full"
              placeholder="Type your message here..."
              rows={1}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button
              aria-label="Send message"
              className={`focus:outline-none transition duration-150 ease-in-out ${
                isMessageEmpty
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-400 hover:text-gray-500"
              }`}
              disabled={isMessageEmpty}
              onClick={handleNewChat}
            >
              <FaArrowCircleUp size={24} />
            </button>
            <button
              aria-label="Activate microphone"
              className="text-gray-500 hover:text-gray-600 focus:outline-none transition duration-150 ease-in-out"
            >
              <FaMicrophone size={24} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConversationPage;
