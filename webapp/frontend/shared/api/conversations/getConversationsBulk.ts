import { fetchApi } from "@/utils";

export const getConversationsBulk = async (): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "GET",
      url: `/api/v1-beta/conversations`,
    });

    return response;
  } catch (err) {
    console.log(err);
  }
};
