import { createContext, useContext, useState, ReactNode } from "react";

type DraftMessage = {
  id: string;
  conversationId: string;
  context: string;
  sender: string;
  status: "pending" | "failed";
};

type DraftMessagesContextType = {
  draftMessages: Record<string, DraftMessage[]>;
  addDraftMessage: (message: DraftMessage) => void;
  updateDraftMessageStatus: (
    conversationId: string,
    id: string,
    status: "pending" | "failed",
  ) => void;
  removeDraftMessage: (conversationId: string, id: string) => void;
};

const DraftMessagesContext = createContext<
  DraftMessagesContextType | undefined
>(undefined);

export const DraftMessagesProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [draftMessages, setDraftMessages] = useState<
    Record<string, DraftMessage[]>
  >({});

  const addDraftMessage = (message: DraftMessage) => {
    setDraftMessages((prev) => ({
      ...prev,
      [message.conversationId]: [
        ...(prev[message.conversationId] || []),
        message,
      ],
    }));
  };

  const updateDraftMessageStatus = (
    conversationId: string,
    id: string,
    status: "pending" | "failed",
  ) => {
    setDraftMessages((prev) => {
      const conversationMessages = prev[conversationId] || [];

      return {
        ...prev,
        [conversationId]: conversationMessages.map((msg) =>
          msg.id === id ? { ...msg, status } : msg,
        ),
      };
    });
  };

  const removeDraftMessage = (conversationId: string, id: string) => {
    setDraftMessages((prev) => {
      const conversationMessages = prev[conversationId] || [];

      return {
        ...prev,
        [conversationId]: conversationMessages.filter((msg) => msg.id !== id),
      };
    });
  };

  return (
    <DraftMessagesContext.Provider
      value={{
        draftMessages,
        addDraftMessage,
        updateDraftMessageStatus,
        removeDraftMessage,
      }}
    >
      {children}
    </DraftMessagesContext.Provider>
  );
};

export const useDraftMessagesContext = () => {
  const context = useContext(DraftMessagesContext);

  if (!context) {
    throw new Error(
      "useDraftMessagesContext must be used within a DraftMessagesProvider",
    );
  }

  return context;
};
