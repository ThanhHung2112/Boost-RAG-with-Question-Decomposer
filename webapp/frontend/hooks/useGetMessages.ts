import { useQuery } from "@tanstack/react-query";

import { getMessagesByConversation } from "@/shared/api/messages";

type Message = {
  id: string;
  conversationId: string;
  context: string;
  sender: string;
  createdTime: string;
};

const getMessagesQueryKey = (conversationId: string) => [
  "getMessages",
  conversationId,
];

const fetchApiMessages = async (
  conversationId: string,
): Promise<Message | []> => {
  try {
    const data = await getMessagesByConversation(conversationId);

    return data;
  } catch (error) {
    console.error("Failed to fetch messages:", error);

    return [];
  }
};

export const useGetMessages = (conversationId: string) => {
  return useQuery({
    queryKey: getMessagesQueryKey(conversationId),
    queryFn: () => fetchApiMessages(conversationId),
    staleTime: 5 * 60 * 1000,
  });
};
