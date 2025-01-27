import { RequestOptions } from "@/interfaces";
import { axiosInstance } from "@/lib";

export const httpRequest = async ({
  method,
  url,
  data,
  params,
  headers,
  typeService = "API_APP",
}: RequestOptions): Promise<any> => {
  try {
    const response = await axiosInstance(typeService).request({
      method,
      url,
      data,
      params,
      headers,
    });

    return response;
  } catch (error) {
    throw error;
  }
};
