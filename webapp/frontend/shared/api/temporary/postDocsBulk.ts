import { fetchApi } from "@/utils";

export const postDocsBulk = async (body: any): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "POST",
      url: `/api/temporary/docs/bulk`,
      data: body,
    });

    return response;
  } catch (err) {
    console.log(err);
  }
};
