import { fetchApi } from "@/utils";

export const getTitleHyperlink = async (body: any): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "POST",
      url: `/api/crawler`,
      data: body,
    });

    return response;
  } catch (err) {
    console.log(err);
  }
};
