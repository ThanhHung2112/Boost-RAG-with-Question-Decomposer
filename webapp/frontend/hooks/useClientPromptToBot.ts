import { useMutation } from "@tanstack/react-query";

import { reactQueryClient } from "@/services/react-query.service";
import {
  getDataSession,
  isKeyInSession,
  removeItemFromSessionArray,
  saveDataToSession,
} from "@/states/session/dataSession";
import { postJobClientPromptContextToBot } from "@/shared/api/jobs";

type Message = {
  id: string;
  conversationId: string;
  context: string;
  sender: string;
  createdTime: string;
};

const CLIENT_TO_BOT_MUTATION_KEY = ["clientToBot"];

const clientPromptToBot = async ({
  conversationId,
  context,
  llm,
  language,
}: {
  conversationId: string;
  context: string;
  llm: string;
  language: string;
}): Promise<any> => {
  try {
    const callbackURL = `http://127.0.0.1:8000/jobs/get_response`;

    const resContext = await postJobClientPromptContextToBot({
      conversationId,
      context,
      llm,
      language,
      callbackURL,
    });

    console.log("Response from API:", resContext);

    return {
      conversationId,
      jobId: resContext.jobId,
    };
  } catch (error) {
    console.error("Error in clientPromptToBot:", error);
    throw error;
  }
};

export const useClientPromptToBot = () => {
  return useMutation<any, Error, any>({
    mutationKey: CLIENT_TO_BOT_MUTATION_KEY,
    mutationFn: clientPromptToBot,
    onSuccess: (messageData) => {
      if (!isKeyInSession(process.env.NEXT_PUBLIC_KEY_SESSION_JOB || "jobs")) {
        saveDataToSession(process.env.NEXT_PUBLIC_KEY_SESSION_JOB || "jobs", [
          {
            conversationId: messageData.conversationId,
            jobId: messageData.jobId,
          },
        ]);
      } else {
        const sessionData =
          getDataSession(process.env.NEXT_PUBLIC_KEY_SESSION_JOB || "jobs") ||
          [];

        saveDataToSession(process.env.NEXT_PUBLIC_KEY_SESSION_JOB || "jobs", [
          ...sessionData,
          {
            conversationId: messageData.conversationId,
            jobId: messageData.jobId,
          },
        ]);
      }
      removeItemFromSessionArray(
        process.env.NEXT_PUBLIC_KEY_SESSION_MESSAGE || "stateMessages",
        messageData.conversationId,
      );
      reactQueryClient.invalidateQueries({
        queryKey: ["getMessages"],
      });
    },
    onError: (error) => {
      console.error("Mutation error:", error);
    },
  });
};
