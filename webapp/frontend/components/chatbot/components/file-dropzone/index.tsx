import React, { useCallback } from "react";
import { useDropzone, FileWithPath } from "react-dropzone";
import { usePathname, useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

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

const FileDropzone: React.FC = () => {
  const router = useRouter();
  const conversationId = usePathname().split("/")[2];
  const { mutate: mutateClientIndexToPdf } = useClientIndexToPdf();

  const { mutate: mutationNewConversations } = useNewConversations();
  const { mutate: mutateSnapshotData } = useSnapshotData();
  const { mutate: mutateGetNameConversations } = useGetNameConversations();
  const { mutate: mutatePostMessage } = usePostMessage();

  const botConfig = useAppSelector((state) => state.botConfig);
  const isActiveDevMode = useAppSelector(
    (state) => state.devMode.isActiveDevMode,
  );

  const processFiles = useCallback((files: File[]) => {
    const pdfFiles = files.filter((file) => file.type === "application/pdf");

    if (pdfFiles.length === 0) {
      alert("No valid PDF file!");

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
    async (files: File[]) => {
      const processedFiles = processFiles(files);

      if (!processedFiles) return;

      const { formData, fileItems } = processedFiles;
      const newConversationId = uuidv4();
      const formattedDateTime = formatDateTime(new Date());

      const userMessage = {
        id: uuidv4(),
        conversationId: newConversationId,
        clientId: uuidv4(),
        context: "PDF file uploaded successfully!",
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
              console.error("Error new conversation:", error);
            }
          },
          onError: (error: any) => {
            console.error("Error new conversation:", error);
          },
        });
      } catch (error) {
        console.error("Error during file upload:", error);
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

  const handleFileUpload = useCallback(
    async (files: File[]) => {
      if (!conversationId) {
        handleNewChat(files);

        return;
      }

      const processedFiles = processFiles(files);

      if (!processedFiles) return;

      const { formData, fileItems } = processedFiles;

      mutatePostMessage({
        id: uuidv4(),
        conversationId,
        context: "File PDF uploaded successfully!",
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

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[]) => {
      const pdfFiles = acceptedFiles.filter(
        (file) => file.type === "application/pdf",
      );

      if (pdfFiles.length > 0) {
        handleFileUpload(pdfFiles);
      } else {
        alert("Please select PDF files");
      }
    },
    [handleFileUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize: 100 * 1024 * 1024,
  });

  return (
    <div className="pt-2 pb-2">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed p-6 text-center cursor-pointer
          ${isDragActive
            ? "border-gray-300"
            : "border-gray-300 hover:border-gray-500"
          }
        `}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-gray-500">Drop PDF files here...</p>
        ) : (
          <p className="text-gray-500 text-sm">
            Drag and drop PDF files here, or click to select
          </p>
        )}
      </div>
    </div>
  );
};

export default FileDropzone;
