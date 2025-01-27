import { useMutation } from "@tanstack/react-query";

import { reactQueryClient } from "@/services/react-query.service";
import { deleteConversations } from "@/shared/api/conversations";
import { deleteHistoryFilesBulk } from "@/shared/api/history-files";
import { deleteHyperlinksBulk } from "@/shared/api/hyperlinks";
import { removeDocuments } from "@/shared/services/chatbot";

const DELETE_CONVERSATIONS_MUTATION_KEY = ["deleteConversations"];

const fetchApiDeleteConversations = async (
  conversationId: string,
): Promise<void> => {
  await deleteHyperlinksBulk(conversationId);
  await deleteHistoryFilesBulk(conversationId);
  await deleteConversations(conversationId);
  await removeDocuments({ chat_id: conversationId, document_id: "" });
};

export const useDeleteConversations = () => {
  return useMutation<void, Error, string>({
    mutationKey: DELETE_CONVERSATIONS_MUTATION_KEY,
    mutationFn: fetchApiDeleteConversations,
    onSuccess: () => {
      reactQueryClient.invalidateQueries({
        queryKey: ["getConversations"],
      });
    },
    onError: (error) => {
      console.error("Failed to delete conversations:", error.message);
    },
  });
};
