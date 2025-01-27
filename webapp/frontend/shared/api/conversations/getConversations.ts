import { fetchApi } from "@/utils";

export const getConversations = async ({
  conversationId,
}: {
  conversationId?: string;
}): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "GET",
      url: `/api/v1-beta/conversations/${conversationId}`,
    });

    return response;
  } catch (err) {
    console.log(err);
  }
};
