import { fetchApi } from "@/utils";

export const postHistoryFilesBulk = async (
  conversationId: string,
  body: any,
): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "POST",
      url: `/api/chatbot/history/${conversationId}/files/bulk`,
      data: body,
    });

    return response;
  } catch (err) {
    console.log(err);
  }
};
