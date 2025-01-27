import { fetchApi } from "@/utils";

export const getTemporaryHyperlinks = async (): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "GET",
      url: `/api/temporary/hyperlinks`,
    });

    return response;
  } catch (err: any) {
    throw new Error(err);
  }
};
