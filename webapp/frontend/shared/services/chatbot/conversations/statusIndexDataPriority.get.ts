import { fetchApi } from "@/utils";

export const getStatusIndexDataPriority = async (params: {
  job_id: string;
}): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "GET",
      url: `/api/v1-beta/jobs/index-data-priority/${params.job_id}`,
    });

    return response;
  } catch (err) {
    console.log(err);
  }
};
