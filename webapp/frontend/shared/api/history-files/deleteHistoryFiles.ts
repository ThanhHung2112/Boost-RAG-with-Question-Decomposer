import { fetchApi } from "@/utils";

export const deleteHistoryFiles = async (
  conversationId: string,
  fileId: string,
): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "DELETE",
      url: `/api/chatbot/history/${conversationId}/files/${fileId}`,
    });

    return response;
  } catch (err) {
    console.log(err);
  }
};
