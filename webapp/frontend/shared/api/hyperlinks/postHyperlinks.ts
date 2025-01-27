import { fetchApi } from "@/utils";

export const postHyperlinks = async (
  conversationId: string,
  body: any,
): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "POST",
      url: `/api/chatbot/history/${conversationId}/hyperlinks`,
      data: body,
    });

    return response;
  } catch (err: any) {
    throw new Error(err);
  }
};
