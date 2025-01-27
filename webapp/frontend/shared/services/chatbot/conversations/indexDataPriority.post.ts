import { fetchApi } from "@/utils";

export const postIndexDataPriority = async (
  data: FormData,
  {
    topic_model,
    language,
  }: {
    topic_model: string;
    language: string;
  } = {
    topic_model: "FASTopic",
    language: "en",
  },
): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "POST",
      typeService: "API_CHATBOT",
      url: `${process.env.NEXT_PUBLIC_SERVICE_POST_INDEX_DATA_PRIORITY}`,
      headers: { "Content-Type": "multipart/form-data" },
      data: data,
      params: {
        topic_model,
        language,
      },
    });

    return response;
  } catch (err) {
    console.log(err);
  }
};
