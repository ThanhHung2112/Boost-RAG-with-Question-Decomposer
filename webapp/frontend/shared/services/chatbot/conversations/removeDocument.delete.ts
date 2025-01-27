import { fetchApi } from "@/utils";

export const removeDocuments = async ({
  chat_id,
  document_id,
}: {
  chat_id: string;
  document_id: string;
}): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "DELETE",
      typeService: "API_CHATBOT",
      url: `${process.env.NEXT_PUBLIC_SERVICE_REMOVE_DOCUMENT}`,
      params: {
        chat_id,
        document_id,
      },
    });

    return response;
  } catch (err) {
    console.log(err);
  }
};
