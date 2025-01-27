import { fetchApi } from "@/utils";

export const getThreads = async (): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "GET",
      url: `/api/v1-beta/conversations/messages`,
    });

    return response;
  } catch (err) {
    console.log(err);
  }
};
