import { useQuery } from "@tanstack/react-query";

import { getTemporaryHyperlinks } from "@/shared/api/temporary";

type TemporaryHyperlink = {
  id: string;
  title: string;
  link: string;
  createdTime: string;
};

const GET_TEMPORARY_HYPERLINKS_QUERY_KEY = ["getTemporaryHyperlinks"];

const fetchApiGetHyperlinksTemporary = async (): Promise<
  TemporaryHyperlink | []
> => {
  try {
    const data = await getTemporaryHyperlinks();

    return data;
  } catch (error) {
    console.error("Failed to fetch conversations:", error);

    return [];
  }
};

export const useGetHyperlinksTemporary = () => {
  return useQuery<TemporaryHyperlink | []>({
    queryKey: GET_TEMPORARY_HYPERLINKS_QUERY_KEY,
    queryFn: fetchApiGetHyperlinksTemporary,
  });
};
