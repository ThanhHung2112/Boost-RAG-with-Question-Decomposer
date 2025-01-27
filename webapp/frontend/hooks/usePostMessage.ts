import { useMutation } from "@tanstack/react-query";

import { postMessages } from "@/shared/api/messages";
import { reactQueryClient } from "@/services/react-query.service";

type Message = {
  id: string;
  conversationId: string;
  context: string;
  sender: string;
  createdTime: string;
};

const POST_MESSAGE_MUTATION_KEY = ["postMessage"];

const postMessage = async (message: Message) => {
  try {
    const data = await postMessages(message.conversationId, message);

    return data;
  } catch (error) {
    console.error("Failed to post message:", error);
    throw error;
  }
};

export const usePostMessage = () => {
  return useMutation<Message, Error, Message>({
    mutationKey: POST_MESSAGE_MUTATION_KEY,
    mutationFn: postMessage,
    onSuccess: (messagesData: any) => {
      reactQueryClient.invalidateQueries({
        queryKey: ["getMessages"],
      });
      reactQueryClient.invalidateQueries({
        queryKey: ["getConversations"],
      });
    },
    onError: (error: any) => {
      console.error("Failed to post message:", error);
    },
  });
};
