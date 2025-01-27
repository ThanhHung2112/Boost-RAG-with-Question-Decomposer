import { fetchApi } from "@/utils";

export const deleteDocs = async (
  docId: string,
  type: string = "",
): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "DELETE",
      url: `/api/temporary/docs/${docId}?type=${type}`,
    });

    return response;
  } catch (err: any) {
    throw new Error(err);
  }
};
