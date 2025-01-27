import { useQuery } from "@tanstack/react-query";

import { getStatusIndexPdf } from "@/shared/services/chatbot/conversations/statusIndexPdf.get";

const GET_STATUS_INDEX_PDF_QUERY_KEY = ["getStatusIndexPdf"];

const fetchApiGetStatusIndexPdf = async (jobID: string): Promise<any> => {
  try {
    const data = await getStatusIndexPdf({
      job_id: jobID,
    });

    return data;
  } catch (error) {
    console.error("Failed to fetch messages:", error);

    return [];
  }
};

export const useGetStautusIndexPdf = (jobID: string) => {
  return useQuery({
    queryKey: GET_STATUS_INDEX_PDF_QUERY_KEY,
    queryFn: () => fetchApiGetStatusIndexPdf(jobID),
  });
};
