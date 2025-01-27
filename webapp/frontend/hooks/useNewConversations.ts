import { useMutation } from "@tanstack/react-query";

import { reactQueryClient } from "@/services/react-query.service";
import { postConversations } from "@/shared/api/conversations";

type Message = {
  id: string;
  conversationId: string;
  context: string;
  sender: string;
  createdTime: string;
};

const POST_CONVERSATIONS_MUTATION_KEY = ["postConversations"];

const postMessage = async (message: Message) => {
  try {
    console.log(message);
    const data = await postConversations(message);

    return data;
  } catch (error) {
    console.error("Failed to post message:", error);
    throw error;
  }
};

export const useNewConversations = () => {
  return useMutation<Message, Error, Message>({
    mutationKey: POST_CONVERSATIONS_MUTATION_KEY,
    mutationFn: postMessage,
    onSuccess: (messagesData: any) => {
      reactQueryClient.invalidateQueries({
        queryKey: ["getConversations"],
      });
    },
    onError: (error: any) => {
      console.error("Failed to post message:", error);
    },
  });
};
