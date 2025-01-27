import { fetchApi } from "@/utils";

export const postMessages = async (
  conversationId: string,
  payload: any,
): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "POST",
      url: `/api/chatbot/history/${conversationId}`,
      data: payload,
    });

    return response;
  } catch (err: any) {
    throw new Error(err);
  }
};
