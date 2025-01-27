import { createContext, useContext, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { formatDateTime } from "@/lib";
import { useNewConversations } from "@/hooks";

interface RagsyConversationContextType {
  conversationId: string;
  setConversationId: React.Dispatch<React.SetStateAction<string>>;
  setTextMessage: React.Dispatch<React.SetStateAction<string>>;
  handleNewConversation: () => Promise<void>;
}

interface IMessage {
  id: string;
  conversationId: string;
  clientId: string;
  context: string;
  sender: string;
  createdTime: string;
}

const RagsyConversationContext = createContext<
  RagsyConversationContextType | undefined
>(undefined);

export const RagsyConversationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [conversationId, setConversationId] = useState<string>("");
  const [textMessage, setTextMessage] = useState<string>("");

  const { mutate: mutateNewConversations } = useNewConversations();

  const createUserMessage = (
    conversationId: string,
    context: string,
  ): IMessage => ({
    id: uuidv4(),
    conversationId,
    clientId: "clienttest",
    context: context.trim(),
    sender: "client",
    createdTime: formatDateTime(new Date()),
  });

  const handleNewConversation = async (): Promise<void> => {
    if (!conversationId || !textMessage.trim()) {
      console.warn("Conversation ID or text message is missing.");

      return;
    }

    const newMessage = createUserMessage(conversationId, textMessage);

    try {
      console.log("Creating new conversation:", newMessage);
      mutateNewConversations(newMessage, {
        onSuccess: (data) => {
          console.log(data);
        },
      });
    } catch (error) {
      console.error("Error creating new conversation:", error);
    }
  };

  return (
    <RagsyConversationContext.Provider
      value={{
        conversationId,
        setConversationId,
        setTextMessage,
        handleNewConversation,
      }}
    >
      {children}
    </RagsyConversationContext.Provider>
  );
};

export const useRagsyConversationContext = (): RagsyConversationContextType => {
  const context = useContext(RagsyConversationContext);

  if (!context) {
    throw new Error(
      "useRagsyConversationContext must be used within RagsyConversationProvider.",
    );
  }

  return context;
};
