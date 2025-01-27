import { fetchApi } from "@/utils";

export const postDocs = async (body: any): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "POST",
      url: `/api/temporary/docs`,
      data: body,
    });

    return response;
  } catch (err) {
    console.log(err);
  }
};
