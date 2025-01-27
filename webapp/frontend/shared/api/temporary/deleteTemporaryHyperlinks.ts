import { fetchApi } from "@/utils";

export const deleteTemporaryHyperlinks = async (
  hyperlinkId: string,
): Promise<any> => {
  console.log(hyperlinkId);

  if (!hyperlinkId) {
    throw new Error("Hyperlink ID is required");
  }

  try {
    const response = await fetchApi({
      method: "DELETE",
      url: `/api/temporary/hyperlinks/${hyperlinkId}`,
    });

    if (!response) {
      throw new Error("No response received from API");
    }

    return response;
  } catch (err: any) {
    console.error("Error deleting temporary hyperlink:", err);
    throw new Error("Failed to delete temporary hyperlink");
  }
};
