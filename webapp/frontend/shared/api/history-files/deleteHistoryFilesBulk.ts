import { fetchApi } from "@/utils";

export const deleteHistoryFilesBulk = async (
  conversationId: string,
): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "DELETE",
      url: `/api/chatbot/history/${conversationId}/files/bulk`,
    });

    return response;
  } catch (err) {
    console.log(err);
  }
};
