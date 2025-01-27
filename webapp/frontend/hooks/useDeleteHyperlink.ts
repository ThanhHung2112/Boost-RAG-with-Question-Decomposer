import { useMutation } from "@tanstack/react-query";

import { reactQueryClient } from "@/services/react-query.service";
import { deleteHyperlinks } from "@/shared/api/hyperlinks";
import { deleteTemporaryHyperlinks } from "@/shared/api/temporary";
import { removeDocuments } from "@/shared/services/chatbot";

type DeleteHyperlinkParams = {
  conversationId: string;
  hyperlinkId: string;
};

type DeleteHyperlinkResponse = void;

const fetchApiDeleteHyperlink = async ({
  conversationId,
  hyperlinkId,
}: DeleteHyperlinkParams): Promise<DeleteHyperlinkResponse> => {
  if (conversationId) {
    await removeDocuments({
      chat_id: conversationId,
      document_id: hyperlinkId,
    });

    return await deleteHyperlinks(conversationId, hyperlinkId);
  }

  return await deleteTemporaryHyperlinks(hyperlinkId);
};

const DELETE_HYPERLINK_MUTATION_KEY = ["deleteHyperlink"];

export const useDeleteHyperlink = () => {
  return useMutation<DeleteHyperlinkResponse, Error, DeleteHyperlinkParams>({
    mutationKey: DELETE_HYPERLINK_MUTATION_KEY,
    mutationFn: fetchApiDeleteHyperlink,
    onSuccess: () => {
      reactQueryClient.invalidateQueries({
        queryKey: ["getHistoryHyperlinksByConversation"],
      });

      reactQueryClient.invalidateQueries({
        queryKey: ["getTemporaryHyperlinks"],
      });
    },
    onError: (error) => {
      console.error("Failed to delete file:", error.message);
    },
  });
};
