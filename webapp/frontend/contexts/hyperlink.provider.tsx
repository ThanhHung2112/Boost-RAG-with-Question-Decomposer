import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";

import { useGetHistoryHyperlinksConversation } from "@/hooks/useGetHistoryHyperlinksByConversation";
import { useGetHyperlinksTemporary } from "@/hooks/useGetHyperlinksTemporary";
import { useDeleteHyperlink } from "@/hooks/useDeleteHyperlink";
import { usePostMessage } from "@/hooks/usePostMessage";
import { getStatusIndexPdf } from "@/shared/services/chatbot/conversations/statusIndexPdf.get";
import {
  getDataSession,
  saveDataToSession,
} from "@/states/session/dataSession";
import { getStatusIndexDataPriority } from "@/shared/services/chatbot";

interface HyperlinkContextType {
  hyperlinks: any;
  isLoading: boolean;
  isError: boolean;
  devMode: boolean;
  updateDevMode: (mode: boolean) => void;
  queueHyperlink: string[];
  removeHyperlink: (conversationId: string, hyperlinkId: string) => void;
  checkAndRemoveFinishedItems: (conversationId: string) => Promise<void>;
}

const HyperlinkContext = createContext<HyperlinkContextType | undefined>(
  undefined,
);

export const HyperlinkProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const conversationId = usePathname().split("/")[2];

  const [queueHyperlink, setQueueHyperlink] = useState<string[]>([]);
  const [devMode, setDevMode] = useState<boolean>(true);

  const { mutate: removeHyperlinkMutation } = useDeleteHyperlink();
  const { mutate: postMessageMutation } = usePostMessage();

  const {
    data: historyHyperlinks,
    isLoading: historyHyperlinksLoading,
    isError: historyHyperlinksError,
  } = useGetHistoryHyperlinksConversation(conversationId);

  const {
    data: temporaryHyperlinks,
    isLoading: temporaryHyperlinksLoading,
    isError: temporaryHyperlinksError,
  } = useGetHyperlinksTemporary();

  const hyperlinks = conversationId ? historyHyperlinks : temporaryHyperlinks;
  const isLoading = conversationId
    ? historyHyperlinksLoading
    : temporaryHyperlinksLoading;
  const isError = conversationId
    ? historyHyperlinksError
    : temporaryHyperlinksError;

  const updateDevMode = (newDevMode: boolean) => {
    console.log("Current devMode:", devMode);
    console.log("New devMode:", newDevMode);
    setDevMode(newDevMode);
    console.log("After setDevMode, devMode is:", devMode);
  };

  const getDevMode = (): boolean => {
    if (typeof window === "undefined") {
      return false;
    }

    const storedState = sessionStorage.getItem("isActiveDevMode");

    return storedState ? JSON.parse(storedState) : false;
  };

  const fetchHyperlinkStatus = async (jobID: string): Promise<string> => {
    try {
      const response = getDevMode()
        ? await getStatusIndexDataPriority({ job_id: jobID })
        : await getStatusIndexPdf({ job_id: jobID });

      return response.status || "unknown";
    } catch (error) {
      console.error(`Error fetching status for jobID ${jobID}:`, error);

      return "error";
    }
  };

  const processQueueItems = useCallback(
    async (conversationId: string) => {
      const sessionKey =
        process.env.NEXT_PUBLIC_KEY_SESSION_HYPERLINK || "hisHyperlink";
      const sessionData = getDataSession(sessionKey) || [];

      const conversationIndex = sessionData.findIndex(
        (entry: any) => entry.conversationId === conversationId,
      );

      if (conversationIndex === -1) return;

      const conversation = sessionData[conversationIndex];
      const remainingItems: any[] = [];

      setQueueHyperlink(conversation.items || []);

      for (const item of conversation.items) {
        const status = await fetchHyperlinkStatus(item.jobID);

        if (status === "finished") {
          postMessageMutation({
            id: item.jobID,
            conversationId,
            context: `✅ Hyperlink "${item.hyperlink}" indexed successfully`,
            sender: "bot",
            createdTime: new Date().toISOString(),
          });

          setQueueHyperlink((prev) =>
            prev.filter((qItem: any) => qItem.jobID !== item.jobID),
          );
        } else if (status === "failed") {
          postMessageMutation({
            id: item.jobID,
            conversationId,
            context: `⚠️ File upload failed for the hyperlink "${item.hyperlink}". Please try again later or contact support if the issue persists.`,
            sender: "bot",
            createdTime: new Date().toISOString(),
          });

          removeHyperlinkMutation({
            conversationId,
            hyperlinkId: item.id,
          });

          setQueueHyperlink((prev) =>
            prev.filter((qItem: any) => qItem.jobID !== item.jobID),
          );
        } else {
          remainingItems.push(item);
        }
      }

      if (remainingItems.length === 0) {
        sessionData.splice(conversationIndex, 1);
      } else {
        sessionData[conversationIndex].items = remainingItems;
      }

      saveDataToSession(sessionKey, sessionData);
    },
    [postMessageMutation, removeHyperlinkMutation],
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (conversationId) processQueueItems(conversationId);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [conversationId, processQueueItems]);

  const removeHyperlink = (conversationId: string, hyperlinkId: string) => {
    removeHyperlinkMutation({ conversationId, hyperlinkId });
  };

  return (
    <HyperlinkContext.Provider
      value={{
        hyperlinks,
        isLoading,
        isError,
        devMode,
        updateDevMode,
        queueHyperlink,
        removeHyperlink,
        checkAndRemoveFinishedItems: processQueueItems,
      }}
    >
      {children}
    </HyperlinkContext.Provider>
  );
};

export const useHyperlinkContext = () => {
  const context = useContext(HyperlinkContext);

  if (!context) {
    throw new Error(
      "useHyperlinkContext must be used within a HyperlinkProvider",
    );
  }

  return context;
};
