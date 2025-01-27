import { useQuery } from "@tanstack/react-query";

import { getHyperlinksBulk } from "@/shared/api/hyperlinks";

type HistoryHyperlink = {
  id: string;
  conversationId: string;
  title: string;
  link: string;
  createdTime: string;
};

const GET_HISTORY_FILES_BY_CONVERSATIONS_QUERY_KEY = [
  "getHistoryHyperlinksByConversation",
];

const fetchApiGetHistoryHyperlinksByConversation = async (
  conversationId: string,
): Promise<HistoryHyperlink | []> => {
  try {
    if (!conversationId) return [];

    const data = await getHyperlinksBulk(conversationId);

    return data;
  } catch (error) {
    console.error("Failed to fetch conversations:", error);

    return [];
  }
};

export const useGetHistoryHyperlinksConversation = (conversationId: string) => {
  return useQuery({
    queryKey: GET_HISTORY_FILES_BY_CONVERSATIONS_QUERY_KEY,
    queryFn: () => fetchApiGetHistoryHyperlinksByConversation(conversationId),
  });
};
