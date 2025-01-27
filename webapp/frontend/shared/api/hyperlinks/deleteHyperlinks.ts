import { fetchApi } from "@/utils";

export const deleteHyperlinks = async (
  conversationId: string,
  hyperlinkId: string,
): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "DELETE",
      url: `/api/chatbot/history/${conversationId}/hyperlinks/${hyperlinkId}`,
    });

    return response;
  } catch (err) {
    console.log(err);
  }
};
