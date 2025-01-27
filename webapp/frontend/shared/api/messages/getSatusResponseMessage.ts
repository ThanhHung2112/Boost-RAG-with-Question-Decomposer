import { fetchApi } from "@/utils";

export const getSatusResponseMessage = async (jobId: string): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "GET",
      url: `/api/jobs/test-job/${jobId}`,
    });

    return response;
  } catch (err: any) {
    throw new Error(err);
  }
};
