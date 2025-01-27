import { fetchApi } from "@/utils";

export const postTemporaryHyperlinks = async (body: any): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "POST",
      url: `/api/temporary/hyperlinks`,
      data: body,
    });

    return response;
  } catch (err) {
    console.log(err);
  }
};
