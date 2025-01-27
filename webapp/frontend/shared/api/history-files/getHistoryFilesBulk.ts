import { fetchApi } from "@/utils";

export const getHistoryFilesBulk = async (
  conversationId: string,
): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "GET",
      url: `/api/chatbot/history/${conversationId}/files/bulk`,
    });

    return response;
  } catch (err) {
    console.log(err);
  }
};
