import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { useDeleteFilePdf } from "@/hooks/useDeleteFilePdf";
import { useGetFilesByConversations } from "@/hooks/useGetHistoryFilesByConversation";
import { useGetFilesTemporary } from "@/hooks/useGetFilesTemporary";
import {
  getDataSession,
  saveDataToSession,
} from "@/states/session/dataSession";
import { getStatusIndexPdf } from "@/shared/services/chatbot/conversations/statusIndexPdf.get";
import { usePostMessage } from "@/hooks/usePostMessage";
import { getStatusIndexDataPriority } from "@/shared/services/chatbot";

interface FileContextType {
  files: any;
  queueFilePDF: string[];
  devMode: boolean;
  updateDevMode: (mode: boolean) => void;
  isFilesLoading: boolean;
  isFilesError: boolean;
  handleRemoveFile: (fileId: string) => void;
}

const FileContext = createContext<FileContextType | undefined>(undefined);

export const IndexerPdfProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const conversationId = usePathname().split("/")[2] || "";

  const [queueFilePDF, setQueueFilePDF] = useState<string[]>([]);
  const [devMode, setDevMode] = useState<boolean>(true);

  const { mutate: mutationRemoveFiles } = useDeleteFilePdf();
  const { mutate: mutatePostMessage } = usePostMessage();

  const {
    data: historyFiles,
    isLoading: isHistoryFilesLoading,
    isError: isHistoryFilesError,
  } = useGetFilesByConversations(conversationId);

  const {
    data: temporaryFiles,
    isLoading: isTemporaryFilesLoading,
    isError: isTemporaryFilesError,
  } = useGetFilesTemporary();

  const updateDevMode = (newDevMode: boolean) => {
    setDevMode(newDevMode);
  };

  const getDevMode = (): boolean => {
    if (typeof window === "undefined") {
      return false;
    }

    const storedState = sessionStorage.getItem("isActiveDevMode");

    return storedState ? JSON.parse(storedState) : false;
  };

  const fetchApiStatusIndexPdf = async (jobID: string) => {
    try {
      const response = getDevMode()
        ? await getStatusIndexDataPriority({ job_id: jobID })
        : await getStatusIndexPdf({ job_id: jobID });

      return response.status;
    } catch (error) {
      console.error(`Error fetching status for jobID ${jobID}:`, error);

      return null;
    }
  };

  const processFileItem = async (
    item: any,
    conversationId: string,
    remainingItems: any[],
  ) => {
    const status = await fetchApiStatusIndexPdf(item.jobID);

    if (status === "finished") {
      mutatePostMessage({
        id: uuidv4(),
        conversationId,
        context: `✅ File "${item.fileName}" indexed successfully`,
        sender: "bot",
        createdTime: new Date().toISOString(),
      });

      setQueueFilePDF((queue) =>
        queue.filter((qItem: any) => qItem.jobID !== item.jobID),
      );
    } else if (status === "failed") {
      mutatePostMessage({
        id: uuidv4(),
        conversationId,
        context: `⚠️ Unfortunately, there was an issue uploading your file "${item.fileName}". Please try again later.`,
        sender: "bot",
        createdTime: new Date().toISOString(),
      });

      mutationRemoveFiles({ conversationId, fileId: item.id });
      setQueueFilePDF((queue) =>
        queue.filter((qItem: any) => qItem.jobID !== item.jobID),
      );
    } else {
      remainingItems.push(item);
    }
  };

  const checkAndRemoveFinishedItems = async (conversationId: string) => {
    const sessionKey = process.env.NEXT_PUBLIC_KEY_SESSION_PDF || "hisFilePDF";
    const sessionData = getDataSession(sessionKey) || [];

    const conversation = sessionData.find(
      (entry: any) => entry.conversationId === conversationId,
    );

    if (!conversation) return;

    setQueueFilePDF(conversation.items || []);

    const remainingItems: any[] = [];

    await Promise.allSettled(
      conversation.items.map((item: any) =>
        processFileItem(item, conversationId, remainingItems),
      ),
    );

    const conversationIndex = sessionData.findIndex(
      (entry: any) => entry.conversationId === conversationId,
    );

    if (remainingItems.length === 0) {
      sessionData.splice(conversationIndex, 1);
    } else {
      sessionData[conversationIndex].items = remainingItems;
    }

    saveDataToSession(sessionKey, sessionData);
  };

  useEffect(() => {
    const fetchStatus = async () => {
      if (conversationId) {
        await checkAndRemoveFinishedItems(conversationId);
      }
    };

    fetchStatus();

    const intervalId = setInterval(fetchStatus, 3000);

    return () => clearInterval(intervalId);
  }, [conversationId]);

  const files = conversationId ? historyFiles : temporaryFiles;
  const isFilesLoading = conversationId
    ? isHistoryFilesLoading
    : isTemporaryFilesLoading;
  const isFilesError = conversationId
    ? isHistoryFilesError
    : isTemporaryFilesError;

  const handleRemoveFile = async (fileId: string) => {
    try {
      mutationRemoveFiles({ conversationId, fileId });
    } catch (error) {
      console.error("Failed to remove file:", error);
    }
  };

  return (
    <FileContext.Provider
      value={{
        files,
        queueFilePDF,
        updateDevMode,
        devMode,
        isFilesLoading,
        isFilesError,
        handleRemoveFile,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};

export const useFileContext = () => {
  const context = useContext(FileContext);

  if (!context) {
    throw new Error("useFileContext must be used within a FileProvider");
  }

  return context;
};
