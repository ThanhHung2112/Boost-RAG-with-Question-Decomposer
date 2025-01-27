import { useMutation } from "@tanstack/react-query";

import { reactQueryClient } from "@/services/react-query.service";
import { deleteHistoryFiles } from "@/shared/api/history-files";
import { deleteDocs } from "@/shared/api/temporary";
import { removeDocuments } from "@/shared/services/chatbot";

type DeleteFilePdfParams = {
  conversationId: string;
  fileId: string;
};

type DeleteFilePdfResponse = void;

const fetchApiDeleteFilePdf = async ({
  conversationId,
  fileId,
}: DeleteFilePdfParams): Promise<DeleteFilePdfResponse> => {
  if (conversationId) {
    await removeDocuments({ chat_id: conversationId, document_id: fileId });

    return await deleteHistoryFiles(conversationId, fileId);
  }

  return await deleteDocs(fileId);
};

const DELETE_FILE_PDF_MUTATION_KEY = ["deleteFilePdf"];

export const useDeleteFilePdf = () => {
  return useMutation<DeleteFilePdfResponse, Error, DeleteFilePdfParams>({
    mutationKey: DELETE_FILE_PDF_MUTATION_KEY,
    mutationFn: fetchApiDeleteFilePdf,
    onSuccess: () => {
      reactQueryClient.invalidateQueries({
        queryKey: ["getHistoryFilesByConversations"],
      });

      reactQueryClient.invalidateQueries({
        queryKey: ["getTemporaryFiles"],
      });
    },
    onError: (error) => {
      console.error("Failed to delete file:", error.message);
    },
  });
};
