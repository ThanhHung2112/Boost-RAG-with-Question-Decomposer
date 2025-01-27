import { useQuery } from "@tanstack/react-query";

import { getFilesTemporary } from "@/shared/api/temporary";

type TemporaryFile = {
  id: string;
  originalName: string;
  pathName: string;
  type: string;
  size: number;
  createdTime: string;
};

const GET_TEMPORARY_FILES_QUERY_KEY = ["getTemporaryFiles"];

const fetchApiGetFilesTemporary = async (): Promise<TemporaryFile | []> => {
  try {
    const data = await getFilesTemporary();

    return data;
  } catch (error) {
    console.error("Failed to fetch conversations:", error);

    return [];
  }
};

export const useGetFilesTemporary = () => {
  return useQuery<TemporaryFile | []>({
    queryKey: GET_TEMPORARY_FILES_QUERY_KEY,
    queryFn: fetchApiGetFilesTemporary,
  });
};
