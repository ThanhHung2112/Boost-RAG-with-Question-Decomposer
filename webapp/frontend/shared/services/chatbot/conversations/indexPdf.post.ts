import { fetchApi } from "@/utils";

type BodyData = {
  chatID: string;
  docID: string;
  file: any;
  url: string;
  base64_file: string;
  is_base64: boolean;
  number_of_topics: number | 0;
};

export const postIndexPdf = async (
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
      url: `${process.env.NEXT_PUBLIC_SERVICE_POST_INDEX_PDF}`,
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
