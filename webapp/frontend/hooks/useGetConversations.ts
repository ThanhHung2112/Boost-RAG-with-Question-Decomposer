import { useQuery } from "@tanstack/react-query";

import { getThreads } from "@/shared/api/conversations";

type Conversation = {
  id: string;
  conversationName: string;
  createdTime: string;
};

const GET_CONVERSATIONS_QUERY_KEY = ["getConversations"];

const fetchApiConversations = async (): Promise<any[]> => {
  try {
    const data = await getThreads();

    console.log(data);

    return data.conversations;
  } catch (error) {
    console.error("Failed to fetch conversations:", error);

    return [];
  }
};

export const useGetConversations = () => {
  return useQuery({
    queryKey: GET_CONVERSATIONS_QUERY_KEY,
    queryFn: fetchApiConversations,
  });
};
