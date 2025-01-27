import { fetchApi } from "@/utils";

export const deleteConversations = async (
  conversationId: string,
): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "DELETE",
      url: `/api/chatbot/history/${conversationId}`,
    });

    return response;
  } catch (err) {
    console.log(err);
  }
};
