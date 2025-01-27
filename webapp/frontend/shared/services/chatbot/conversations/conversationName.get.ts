import { fetchApi } from "@/utils";

export const getConversationNames = async (data: {
  message: string;
}): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "GET",
      typeService: "API_CHATBOT",
      url: `${process.env.NEXT_PUBLIC_SERVICE_GET_CONVERSATION_NAME}`,
      params: data,
    });

    return response;
  } catch (err) {
    console.log(err);
  }
};
