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

export const postJobClientIndexDataPriority = async (
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
      url: `/api/v1-beta/jobs/index-data-priority`,
      headers: { "Content-Type": "multipart/form-data" },
      data: data,
      params: {
        topic_model,
        language,
      },
    });

    console.log("jobResponse", response);

    return response;
  } catch (err) {
    console.log(err);
  }
};
