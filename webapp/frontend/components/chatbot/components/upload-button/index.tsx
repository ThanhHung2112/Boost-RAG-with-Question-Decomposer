import React, { useCallback } from "react";
import { Button } from "@nextui-org/button";
import { MdOutlineFileUpload } from "react-icons/md";
import { v4 as uuidv4 } from "uuid";
import { usePathname, useRouter } from "next/navigation";

import FileDropzone from "../file-dropzone";

import { formatDateTime } from "@/lib/format";
import {
  useAppSelector,
  useClientIndexToPdf,
  useNewConversations,
  usePostMessage,
} from "@/hooks";
import { saveDataToSession } from "@/states/session/dataSession";
import { useSnapshotData } from "@/hooks/useSnapshotData";
import { useGetNameConversations } from "@/hooks/useGetNameConversastions";
import { useFileContext } from "@/contexts/indexerPdf.provider";

export const UploadButton: React.FC = () => {
  const router = useRouter();
  const conversationId = usePathname().split("/")[2];
  const { mutate: mutateClientIndexToPdf } = useClientIndexToPdf();
  const { mutate: mutationNewConversations } = useNewConversations();
  const { mutate: mutateSnapshotData } = useSnapshotData();
  const { mutate: mutateGetNameConversations } = useGetNameConversations();
  const { mutate: mutatePostMessage } = usePostMessage();

  const { devMode, updateDevMode } = useFileContext();

  const botConfig = useAppSelector((state) => state.botConfig);
  const isActiveDevMode = useAppSelector(
    (state) => state.devMode.isActiveDevMode,
  );

  const processFiles = useCallback((files: FileList) => {
    const pdfFiles = Array.from(files).filter(
      (file) => file.type === "application/pdf",
    );

    if (pdfFiles.length === 0) {
      alert("No valid PDF files selected!");

      return null;
    }

    const formData = new FormData();
    const fileItems = pdfFiles.map((file) => {
      const uniqueId = uuidv4();

      formData.append("files", file);
      formData.append("fileId", uniqueId);

      return {
        id: uniqueId,
        originalName: file.name,
        type: file.type,
        size: file.size,
        createdTime: formatDateTime(new Date()),
      };
    });

    return { formData, fileItems };
  }, []);

  const handleNewChat = useCallback(
    async (files: FileList) => {
      const processedFiles = processFiles(files);

      if (!processedFiles) return;

      const { formData, fileItems } = processedFiles;
      const newConversationId = uuidv4();
      const formattedDateTime = formatDateTime(new Date());

      const userMessage = {
        id: uuidv4(),
        conversationId: newConversationId,
        clientId: uuidv4(),
        context: "File PDF uploaded successfully!",
        sender: "bot",
        createdTime: formattedDateTime,
      };

      formData.append(
        "number_of_topics",
        (botConfig.topicModel.numberTopics || 0).toString(),
      );

      try {
        mutateClientIndexToPdf({
          formData,
          conversationId: newConversationId,
          data: { data: fileItems },
          type: "PDF",
          mode: isActiveDevMode,
          params: {
            topic_model: botConfig.topicModel.name,
            language: botConfig.modelLanguage,
          },
        });

        mutationNewConversations(userMessage, {
          onSuccess: async () => {
            try {
              await Promise.all([
                mutateGetNameConversations({
                  conversationId: newConversationId,
                  contextMessage: processedFiles.fileItems[0].originalName ? processedFiles.fileItems[0].originalName : "Can you help me?",
                }),
                // saveDataToSession(newConversationId, {
                //   messageText: userMessage.context,
                // }),
                mutateSnapshotData(newConversationId),
              ]);

              router.push(`/c/${newConversationId}`);
            } catch (error) {
              console.error("Post-conversation tasks failed:", error);
            }
          },
          onError: (error: any) => {
            console.error("Chat creation failed:", error);
          },
        });
      } catch (error) {
        console.error("Unexpected error in handleNewChat:", error);
      }
    },
    [
      processFiles,
      mutateClientIndexToPdf,
      mutationNewConversations,
      mutateGetNameConversations,
      saveDataToSession,
      mutateSnapshotData,
      router,
      botConfig,
    ],
  );

  const handleFilesChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      const files = event.target.files;

      if (!files) return;

      if (!conversationId) {
        handleNewChat(files);

        return;
      }

      const processedFiles = processFiles(files);

      if (!processedFiles) return;

      updateDevMode(devMode);
      const { formData, fileItems } = processedFiles;

      mutatePostMessage({
        id: uuidv4(),
        conversationId,
        context: "hello bot",
        sender: "bot",
        createdTime: formatDateTime(new Date()),
      });

      mutateClientIndexToPdf({
        formData,
        conversationId,
        data: { data: fileItems },
        type: "PDF",
        mode: isActiveDevMode,
        params: {
          topic_model: botConfig.topicModel.name,
          language: botConfig.modelLanguage,
        },
      });
    },
    [
      conversationId,
      handleNewChat,
      processFiles,
      mutateClientIndexToPdf,
      botConfig,
    ],
  );

  return (
    <div className="flex flex-col items-center mb-3">
      <input
        multiple
        accept=".pdf"
        aria-label="Upload PDF files"
        className="hidden"
        id="file-upload"
        type="file"
        onChange={handleFilesChange}
      />
      <Button
        as="label"
        className="cursor-pointer bg-gray-300 hover:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg w-full"
        htmlFor="file-upload"
      >
        <div className="flex items-center space-x-2">
          <MdOutlineFileUpload className="w-4 h-4" />
          <span className="text-sm">Upload PDF File</span>
        </div>
      </Button>
      <FileDropzone />
    </div>
  );
};
