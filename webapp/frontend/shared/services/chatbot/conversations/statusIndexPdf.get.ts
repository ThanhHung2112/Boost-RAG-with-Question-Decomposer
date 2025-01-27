import { fetchApi } from "@/utils";

export const getStatusIndexPdf = async (params: {
  job_id: string;
}): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "GET",
      typeService: "API_CHATBOT",
      url: `${process.env.NEXT_PUBLIC_SERVICE_GET_INDEX_PDF_STATUS}`,
      params,
    });

    return response;
  } catch (err) {
    console.log(err);
  }
};
