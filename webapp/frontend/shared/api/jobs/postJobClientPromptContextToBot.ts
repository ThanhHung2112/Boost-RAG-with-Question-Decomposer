import { fetchApi } from "@/utils";

export const postJobClientPromptContextToBot = async ({
  conversationId,
  context,
  llm,
  language,
  callbackURL,
}: {
  conversationId: string;
  context: string;
  llm: string;
  language: string;
  callbackURL: string;
}): Promise<any> => {
  try {
    const response = await fetchApi({
      method: "GET",
      url: `/api/jobs/test-job`,
      params: {
        conversationId,
        context,
        llm,
        language,
        callbackURL,
      },
    });

    return response;
  } catch (err: any) {
    throw new Error(err);
  }
};
