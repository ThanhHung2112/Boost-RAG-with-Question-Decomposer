import { useQuery } from "@tanstack/react-query";

import { getHistoryFilesBulk } from "@/shared/api/history-files";

type HistoryFile = {
  id: string;
  conversationId: string;
  originalName: string;
  pathName: string;
  type: string;
  size: number;
  createdTime: string;
};

const GET_HISTORY_FILES_BY_CONVERSATIONS_QUERY_KEY = [
  "getHistoryFilesByConversations",
];

const fetchApiGetHistoryFilesByConversation = async (
  conversationId: string,
): Promise<HistoryFile | []> => {
  try {
    if (!conversationId) return [];

    const data = await getHistoryFilesBulk(conversationId);

    return data;
  } catch (error) {
    console.error("Failed to fetch conversations:", error);

    return [];
  }
};

export const useGetFilesByConversations = (conversationId: string) => {
  return useQuery<HistoryFile | []>({
    queryKey: GET_HISTORY_FILES_BY_CONVERSATIONS_QUERY_KEY,
    queryFn: () => fetchApiGetHistoryFilesByConversation(conversationId),
  });
};
