import { useQuery } from "@tanstack/react-query";

import { getResponseContext } from "@/shared/services/chatbot";

type TResponseContext = {
  chatID: string;
  message: string;
  llm?: string;
  language?: string;
};

const GET_RESPONSE_CONTEXT_QUERY_KEY = ["getResponseContext"];

const fetchApiResponseContext = async (params: TResponseContext) => {
  try {
    const data = await getResponseContext(params);

    return data.response;
  } catch (error) {
    console.error("Failed to fetch messages:", error);
  }
};

export const useReponseContext = (params: TResponseContext) => {
  return useQuery({
    queryKey: GET_RESPONSE_CONTEXT_QUERY_KEY,
    queryFn: () => fetchApiResponseContext(params),
  });
};
