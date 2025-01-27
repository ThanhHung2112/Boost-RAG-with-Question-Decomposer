import React, { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { IoMdAdd } from "react-icons/io";
import { v4 as uuidv4 } from "uuid";

import { formatDateTime } from "@/lib";
import { getTitleHyperlink } from "@/shared/api/crawler/getTitleHyperlink";
import { useClientIndexToHyperlink } from "@/hooks/useClientIndexToHyperlink";
import { useTemporaryIndexToHyperlink } from "@/hooks/useTemporaryIndexToHyperlink";
import { useToastMessage } from "@/hooks/useToastMessage";
import { useAppSelector, useNewConversations, usePostMessage } from "@/hooks";
import { validateUrl } from "@/utils";
import { useSnapshotData } from "@/hooks/useSnapshotData";
import { useGetNameConversations } from "@/hooks/useGetNameConversastions";
import { saveDataToSession } from "@/states/session/dataSession";
import { useHyperlinkContext } from "@/contexts/hyperlink.provider";

interface Hyperlink {
  id: string;
  title: string;
  conversationId: string;
  link: string;
  createdTime: string;
}

export const InputLink: React.FC = () => {
  const [link, setLink] = useState("");
  const conversationId = usePathname().split("/")[2];
  const router = useRouter();

  const { mutate: uploadHyperlinks } = useClientIndexToHyperlink();
  const { mutate: uploadTemporaryHyperlinks } = useTemporaryIndexToHyperlink();
  const { toast } = useToastMessage();

  const { mutate: mutationNewConversations } = useNewConversations();
  const { mutate: mutateSnapshotData } = useSnapshotData();
  const { mutate: mutateGetNameConversations } = useGetNameConversations();
  const { mutate: mutatePostMessage } = usePostMessage();

  const { devMode, updateDevMode } = useHyperlinkContext();

  const botConfig = useAppSelector((state) => state.botConfig);
  const isActiveDevMode = useAppSelector(
    (state) => state.devMode.isActiveDevMode,
  );

  const createHyperlinkMetadata = useCallback(
    async (
      inputLink: string,
      targetConversationId: string,
    ): Promise<Hyperlink | null> => {
      try {
        const hyperlinkTitle = await getTitleHyperlink({
          data: { hyperLink: inputLink },
        });

        return {
          id: uuidv4(),
          title: hyperlinkTitle.titleUrl,
          conversationId: targetConversationId,
          link: inputLink,
          createdTime: formatDateTime(new Date()),
        };
      } catch (error) {
        toast.error("Failed to fetch hyperlink title");

        return null;
      }
    },
    [],
  );

  const handleNewChat = useCallback(async () => {
    const newConversationId = uuidv4();
    const formattedDateTime = formatDateTime(new Date());

    const userMessage = {
      id: uuidv4(),
      conversationId: newConversationId,
      clientId: uuidv4(),
      context: "Crawling data hyperlink!",
      sender: "bot",
      createdTime: formattedDateTime,
    };

    const newHyperlink = await createHyperlinkMetadata(link, newConversationId);

    if (!newHyperlink) return;

    try {
      uploadHyperlinks({
        conversationId: newConversationId,
        data: newHyperlink,
        type: "HYPERLINK",
        mode: isActiveDevMode,
        params: {
          topic_model: botConfig.topicModel.name,
          language: botConfig.modelLanguage,
        },
      });

      mutationNewConversations(userMessage, {
        onSuccess: async () => {
          setLink("");

          try {
            await Promise.all([
              mutateGetNameConversations({
                conversationId: newConversationId,
                contextMessage: newHyperlink.title ? newHyperlink.title : "Can you help me?",
              }),
              // saveDataToSession(newConversationId, {
              //   messageText: userMessage.context,
              // }),
              mutateSnapshotData(newConversationId),
            ]);

            uploadTemporaryHyperlinks({ conversationId: newConversationId });
            router.push(`/c/${newConversationId}`);
          } catch (error) {
            console.error("Post-conversation tasks failed:", error);
            toast.error("Failed to complete post-conversation tasks");
          }
        },
        onError: (error) => {
          console.error("Chat creation failed:", error);
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to create conversation.",
          );
        },
      });
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred.");
    }
  }, [
    link,
    createHyperlinkMetadata,
    uploadHyperlinks,
    mutationNewConversations,
    mutateGetNameConversations,
    saveDataToSession,
    mutateSnapshotData,
    uploadTemporaryHyperlinks,
    router,
    botConfig,
    toast,
  ]);

  const handleHyperlinkSubmit = useCallback(async () => {
    if (!validateUrl(link)) {
      toast.error("Invalid URL! Please enter a valid URL.");
      setLink("");

      return;
    }

    if (!conversationId) {
      await handleNewChat();

      return;
    }

    const newHyperlink = await createHyperlinkMetadata(link, conversationId);

    if (!newHyperlink) return;

    updateDevMode(!devMode);

    mutatePostMessage({
      id: uuidv4(),
      conversationId,
      context: "Crawling data hyperlink!",
      sender: "bot",
      createdTime: formatDateTime(new Date()),
    });

    uploadHyperlinks({
      conversationId,
      data: newHyperlink,
      type: "HYPERLINK",
      mode: isActiveDevMode,
      params: {
        topic_model: botConfig.topicModel.name,
        language: botConfig.modelLanguage,
      },
    });

    setLink("");
  }, [
    link,
    conversationId,
    createHyperlinkMetadata,
    uploadHyperlinks,
    handleNewChat,
    botConfig,
    toast,
  ]);

  const handleLinkInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      setLink(event.target.value.trim());
    },
    [],
  );

  useEffect(() => {
    if (conversationId) {
      uploadTemporaryHyperlinks({ conversationId });
    }
  }, [conversationId, uploadTemporaryHyperlinks]);

  return (
    <div className="flex items-center justify-center space-x-2 mb-3">
      <input
        className="border border-gray-300 p-2 rounded-lg w-full text-sm"
        placeholder="Input here your link"
        type="text"
        value={link}
        onChange={handleLinkInputChange}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            setLink("");
            handleHyperlinkSubmit();
          }
        }}
      />
      {link.length > 0 && (
        <button
          className="bg-gray-300 text-white rounded-lg p-2 hover:bg-gray-400"
          onClick={handleHyperlinkSubmit}
        >
          <IoMdAdd />
        </button>
      )}
    </div>
  );
};
