import { handleApiError } from "./errorHandler";
import { httpRequest } from "./httpRequest";

import { ApiResponse, RequestOptions } from "@/interfaces";

export const fetchApi = async ({
  ...props
}: RequestOptions): Promise<ApiResponse | null | undefined> => {
  try {
    const response = await httpRequest({ ...props });

    if (response.status >= 200) {
      return response.data;
    } else {
      return null;
    }
  } catch (error) {
    handleApiError(error);
  }
};
