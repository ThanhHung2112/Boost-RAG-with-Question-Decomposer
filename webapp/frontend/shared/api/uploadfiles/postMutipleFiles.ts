import { fetchApi } from "@/utils";

export const postMutipleFiles = async (body: any): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "POST",
      url: `api/uploadfile/mutiple`,
      data: body,
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response;
  } catch (err: any) {
    throw new Error(err);
  }
};
