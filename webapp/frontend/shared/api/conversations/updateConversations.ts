import { fetchApi } from "@/utils";

export const updateConversations = async (
  conversationId: string,
  updateData: { data: { conversationName?: string } },
): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "PUT",
      url: `/api/v1-beta/conversations/${conversationId}`,
      data: updateData,
    });

    return response;
  } catch (err) {
    console.log(err);
  }
};
