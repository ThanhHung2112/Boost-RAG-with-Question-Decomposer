import { fetchApi } from "@/utils";

export const getFilesTemporary = async (): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "GET",
      url: `/api/temporary/docs`,
    });

    return response;
  } catch (err: any) {
    throw new Error(err);
  }
};
