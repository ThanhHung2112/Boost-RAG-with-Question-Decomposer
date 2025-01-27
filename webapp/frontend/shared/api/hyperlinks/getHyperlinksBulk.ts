import { fetchApi } from "@/utils";

export const getHyperlinksBulk = async (
  conversationId: string,
): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "GET",
      url: `/api/chatbot/history/${conversationId}/hyperlinks/bulk`,
    });

    return response;
  } catch (err: any) {
    throw new Error(err);
  }
};
