export const handleApiError = (error: any): string => {
  if (error.response) {
    return error.response.data?.message || "Unknown API error";
  }

  return error.message || "Network error";
};
