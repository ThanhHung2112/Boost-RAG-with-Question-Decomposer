import { fetchApi } from "@/utils";

export const getMessagesByConversation = async (
  conversationId: string,
): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "GET",
      url: `/api/chatbot/history/${conversationId}`,
    });

    return response;
  } catch (err: any) {
    throw new Error(err);
  }
};
