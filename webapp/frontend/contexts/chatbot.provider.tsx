"use client";

import { v4 as uuidv4 } from "uuid";
import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
} from "react";
import { usePathname } from "next/navigation";

import { formatDateTime } from "@/lib";
import {
  useAppDispatch,
  useAppSelector,
  useClientPromptToBot,
  usePostMessage,
} from "@/hooks";
import {
  addStateMessage,
  removeStateMessage,
} from "@/lib/features/stateMessages/stateMessages";
import {
  addItemToSession,
  getDataSession,
  isKeyInSession,
  removeDataSession,
  saveDataToSession,
} from "@/states/session/dataSession";
import { getSatusResponseMessage } from "@/shared/api/messages/getSatusResponseMessage";
import { reactQueryClient } from "@/services/react-query.service";
import { useGetNameConversations } from "@/hooks/useGetNameConversastions";
import { useNewConversations } from "@/hooks/useNewConversations";

interface IMessage {
  id: string;
  conversationId: string;
  clientId: string;
  context: string;
  sender: string;
  createdTime: string;
}

interface ChatContextProps {
  conversationId: string;
  newConversationId: string;
  textMessage: string;
  setTextMessage: React.Dispatch<React.SetStateAction<string>>;
  stateResponse: boolean;
  setStateResponse: React.Dispatch<React.SetStateAction<boolean>>;
  onSendMessage: () => Promise<void>;
  resetNewConversationId: () => void;
}

const ChatContext = createContext<ChatContextProps | undefined>(undefined);

export const ChatbotProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  let conversationId = pathname.split("/")[2] || "";

  const [textMessage, setTextMessage] = useState<string>("");
  const [stateResponse, setStateResponse] = useState<boolean>(false);
  const [newConversationId, setNewConversationId] = useState<string>("");

  const { mutate: mutatePostMessage } = usePostMessage();
  const { mutate: mutateClientPromptToBot } = useClientPromptToBot();
  const { mutate: mutateGetNameConversations } = useGetNameConversations();
  const { mutate: mutateNewConversations } = useNewConversations();

  const dispatch = useAppDispatch();
  const states = useAppSelector((state) => state.stateMessages);
  const botConfig = useAppSelector((state) => state.botConfig);

  const sessionKeyMessage =
    process.env.NEXT_PUBLIC_KEY_SESSION_MESSAGE || "stateMessages";
  const sessionKeyJob = process.env.NEXT_PUBLIC_KEY_SESSION_JOB || "jobs";

  const resetNewConversationId = useCallback(() => {
    setNewConversationId("");
  }, []);

  useEffect(() => {
    const hasPendingMessages =
      states.stateMessages.some(
        (message) => message.conversationId === conversationId,
      ) && getDataSession(sessionKeyMessage)?.includes(conversationId);

    setStateResponse(hasPendingMessages);
  }, [states.stateMessages, conversationId, sessionKeyMessage]);

  useEffect(() => {
    if (!conversationId || !isKeyInSession(conversationId)) return;

    setStateResponse(true);
    const sessionData = getDataSession(conversationId);

    removeDataSession(conversationId);

    mutateClientPromptToBot(
      {
        llm: botConfig.model,
        language: botConfig.modelLanguage,
        conversationId,
        context: sessionData.messageText,
      },
      {
        onSuccess: () => {
          setStateResponse(false);
          dispatch(removeStateMessage(conversationId));
        },
        onError: () => setStateResponse(false),
      },
    );
  }, [conversationId, mutateClientPromptToBot, dispatch, botConfig]);

  useEffect(() => {
    if (!conversationId) return;

    const intervalId = setInterval(async () => {
      try {
        const jobs = getDataSession(sessionKeyJob) || [];
        const currentJob = jobs.find(
          (job: any) => job.conversationId === conversationId,
        );

        if (!currentJob) return;

        const { state: jobState } = await getSatusResponseMessage(
          currentJob.jobId,
        );

        setStateResponse(true);

        if (["completed", "failed"].includes(jobState)) {
          dispatch(removeStateMessage(conversationId));

          const updatedJobs = jobs.filter(
            (job: any) => job.conversationId !== conversationId,
          );

          saveDataToSession(sessionKeyJob, updatedJobs);

          reactQueryClient.invalidateQueries({ queryKey: ["getMessages"] });

          if (jobState === "failed") {
            mutatePostMessage({
              id: uuidv4(),
              conversationId,
              context:
                "⚠️ Bot could not respond at this time. Please try again later.",
              sender: "bot",
              createdTime: formatDateTime(new Date()),
            });
          }

          setStateResponse(false);
        }
      } catch (error) {
        console.error("Error checking job status:", error);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [
    conversationId,
    dispatch,
    setStateResponse,
    mutatePostMessage,
    sessionKeyJob,
  ]);

  const handleSendMessage = useCallback(async () => {
    if (!textMessage.trim()) return;

    const formattedDateTime = formatDateTime(new Date());

    const createUserMessage = (conversationId: string): IMessage => ({
      id: uuidv4(),
      conversationId,
      clientId: "clienttest",
      context: textMessage.trim(),
      sender: "client",
      createdTime: formattedDateTime,
    });

    const handleMutationError = (error: any) => {
      console.error("Error during mutation:", error);
      setStateResponse(false);
      resetNewConversationId();
    };

    const sendMessageToBot = (conversationId: string, context: string) => {
      mutateClientPromptToBot(
        {
          llm: botConfig.model,
          language: botConfig.modelLanguage,
          conversationId,
          context,
        },
        {
          onSuccess: () => setStateResponse(false),
          onError: handleMutationError,
        },
      );
    };

    const handleNewConversation = () => {
      const newId = uuidv4();

      setNewConversationId(newId);

      const userMessage = createUserMessage(newId);

      mutateNewConversations(userMessage, {
        onSuccess: () => {
          mutateGetNameConversations({
            conversationId: newId,
            contextMessage: userMessage.context,
          });
        },
      });

      setStateResponse(true);

      sendMessageToBot(newId, userMessage.context);
    };

    const handleExistingConversation = () => {
      const userMessage = createUserMessage(conversationId);

      setTextMessage("");
      dispatch(addStateMessage({ conversationId, chatId: userMessage.id }));

      if (!isKeyInSession(sessionKeyMessage)) {
        saveDataToSession(sessionKeyMessage, [conversationId]);
      } else {
        addItemToSession(sessionKeyMessage, conversationId);
      }

      mutatePostMessage(userMessage, {
        onSuccess: () => {
          sendMessageToBot(conversationId, userMessage.context);
        },
        onError: handleMutationError,
      });

      setStateResponse(true);
    };

    if (!conversationId) {
      handleNewConversation();
    } else {
      handleExistingConversation();
    }
  }, [
    textMessage,
    conversationId,
    dispatch,
    mutatePostMessage,
    mutateClientPromptToBot,
    mutateGetNameConversations,
    mutateNewConversations,
    botConfig,
    sessionKeyMessage,
    resetNewConversationId,
  ]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (newConversationId) {
      timeoutId = setTimeout(() => {
        resetNewConversationId();
      }, 2000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [newConversationId, resetNewConversationId]);

  return (
    <ChatContext.Provider
      value={{
        conversationId,
        newConversationId,
        textMessage,
        setTextMessage,
        stateResponse,
        setStateResponse,
        onSendMessage: handleSendMessage,
        resetNewConversationId,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatbotContext = (): ChatContextProps => {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("RasyContext must be used within RagsyProvider");
  }

  return context;
};
