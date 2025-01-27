import { fetchApi } from "@/utils";

export const postConversations = async (body: any): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "POST",
      url: `/api/chatbot/history`,
      data: body,
    });

    return response;
  } catch (err) {
    console.log(err);
  }
};
