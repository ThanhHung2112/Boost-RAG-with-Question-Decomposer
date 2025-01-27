import { useMutation } from "@tanstack/react-query";

import { getConversationNames } from "@/shared/services/chatbot";
import {
  getConversations,
  updateConversations,
} from "@/shared/api/conversations";
import { reactQueryClient } from "@/services/react-query.service";

const GET_NAME_CONVERSATIONS_MUTATION_KEY = ["getNameConversations"];

const getNameConversations = async ({
  conversationId,
  contextMessage,
}: {
  conversationId: string;
  contextMessage: string;
}): Promise<void> => {
  try {
    const getConversation = await getConversations({ conversationId });

    if (getConversation.conversationName === "New conversation") {
      const resConversationName = await getConversationNames({
        message: contextMessage,
      });

      await updateConversations(conversationId, {
        data: {
          conversationName: resConversationName.conversation_name,
        },
      });
    }
  } catch (error) {
    console.error("Error in clientPromptToBot:", error);
    throw error;
  }
};

export const useGetNameConversations = () => {
  return useMutation<
    void,
    Error,
    { conversationId: string; contextMessage: string }
  >({
    mutationKey: GET_NAME_CONVERSATIONS_MUTATION_KEY,
    mutationFn: getNameConversations,
    onSuccess: (messageData) => {
      console.log("Mutation succeeded:", messageData);
      reactQueryClient.invalidateQueries({
        queryKey: ["getConversations"],
      });
    },
    onError: (error) => {
      console.error("Mutation error:", error);
    },
  });
};
