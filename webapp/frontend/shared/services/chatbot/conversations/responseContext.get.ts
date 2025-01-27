import { fetchApi } from "@/utils";

export const getResponseContext = async ({
  chatID,
  message,
  llm = "gemma2:2b",
  language = "en",
}: {
  chatID: string;
  message: string;
  llm?: string;
  language?: string;
}): Promise<any> => {
  const response = await fetchApi({
    method: "GET",
    typeService: "API_CHATBOT",
    url: `${process.env.NEXT_PUBLIC_SERVICE_GET_RESPONSE}`,
    params: { chatID, message, llm, language },
  });

  return response;
};
