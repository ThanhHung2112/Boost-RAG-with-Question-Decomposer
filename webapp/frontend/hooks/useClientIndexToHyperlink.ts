import { useMutation } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";

import { formatDateTime } from "@/lib";
import { reactQueryClient } from "@/services/react-query.service";
import { getTitleHyperlink } from "@/shared/api/crawler/getTitleHyperlink";
import { postHyperlinks } from "@/shared/api/hyperlinks";
import { postTemporaryHyperlinks } from "@/shared/api/temporary";
import { postIndexPdf } from "@/shared/services/chatbot";
import {
  getDataSession,
  saveDataToSession,
} from "@/states/session/dataSession";
import { postJobClientIndexDataPriority } from "@/shared/api/jobs";

type Hyperlink = {
  id: string;
  conversationId: string;
  title: string;
  link: string;
  createdTime: string;
};

type TemporaryHyperlink = {
  id: string;
  title: string;
  link: string;
  createdTime: string;
};

type ParamsHyperlink = {
  conversationId: string;
  data: Hyperlink | TemporaryHyperlink;
  type: string;
  mode: boolean;
  params: {
    topic_model: string | "FASTopic";
    language: string | "en";
  };
};

type HyperlinkSessionItem = {
  id: string;
  jobID: string;
};

type HyperlinkSessionEntry = {
  conversationId: string;
  items: HyperlinkSessionItem[];
};

const CLIENT_INDEX_TO_HYPERLINK_MUTATION_KEY = ["clientIndexToHyperlink"];

const fetchApiClientIndexToHyperlink = async ({
  conversationId,
  data,
  type,
  mode,
  params,
}: ParamsHyperlink): Promise<{
  historyResponse: any;
  conversationId: string;
} | void> => {
  const title = await getTitleHyperlink({ data: { hyperLink: data.link } });

  const getDevMode = (): boolean => {
    if (typeof window === "undefined") {
      return false;
    }

    const storedState = sessionStorage.getItem("isActiveDevMode");

    return storedState ? JSON.parse(storedState) : false;
  };

  try {
    if (type === "HYPERLINK") {
      if (conversationId) {
        const historyResponse = await postHyperlinks(conversationId, data);

        const newHyperlink = {
          id: uuidv4(),
          title: title.titleUrl,
          conversationId,
          link: data.link,
          createdTime: formatDateTime(new Date()),
        };

        const formData = new FormData();

        formData.append("chatID", conversationId);
        formData.append("docID", newHyperlink.id);
        formData.append("url", newHyperlink.link);
        formData.append("base64_file", "");
        formData.append("is_base64", "false");

        const numberOfTopics = Array.from(formData.entries()).find(
          ([key]) => key === "number_of_topics",
        )?.[1];

        if (numberOfTopics) {
          const numberOfTopicsString = numberOfTopics.toString();
          const parsedNumberOfTopics = parseInt(numberOfTopicsString);

          if (!isNaN(parsedNumberOfTopics)) {
            const numberOfTopicsString = parsedNumberOfTopics.toString();

            formData.append("number_of_topics", numberOfTopicsString);
          } else {
            console.error(
              "Invalid number for 'number_of_topics'",
              numberOfTopics,
            );
          }
        }

        let job_id = "";

        if (getDevMode()) {
          const { jobID } = await postJobClientIndexDataPriority(
            formData,
            params,
          );

          job_id = jobID;
          console.log("Dev mode test job_id", jobID);
        } else {
          const response = await postIndexPdf(formData, params);

          job_id = response.job_id;
        }

        const sessionData =
          getDataSession(
            process.env.NEXT_PUBLIC_KEY_SESSION_HYPERLINK || "hisHyperlink",
          ) || [];

        const existingEntryIndex = sessionData.findIndex(
          (entry: any) => entry.conversationId === conversationId,
        );

        if (existingEntryIndex !== -1) {
          const updatedSessionData = [...sessionData];

          updatedSessionData[existingEntryIndex].items = [
            ...(updatedSessionData[existingEntryIndex].items || []),
            {
              id: historyResponse.id,
              jobID: job_id,
              hyperlink: newHyperlink.link,
            },
          ];

          saveDataToSession(
            process.env.NEXT_PUBLIC_KEY_SESSION_HYPERLINK || "hisHyperlink",
            updatedSessionData,
          );
        } else {
          saveDataToSession(
            process.env.NEXT_PUBLIC_KEY_SESSION_HYPERLINK || "hisHyperlink",
            [
              ...sessionData,
              {
                conversationId,
                items: [
                  {
                    id: historyResponse.id,
                    jobID: job_id,
                    hyperlink: newHyperlink.link,
                  },
                ],
              },
            ],
          );
        }

        return {
          historyResponse,
          conversationId,
        };
      }

      if (!conversationId) {
        return await postTemporaryHyperlinks(data);
      }
    }
  } catch (error) {
    console.error("Error in fetchApiClientIndexToHyperlink:", error);
    throw error;
  }
};

export const useClientIndexToHyperlink = () => {
  return useMutation<
    { historyResponse: any; conversationId: string } | void,
    Error,
    ParamsHyperlink
  >({
    mutationKey: CLIENT_INDEX_TO_HYPERLINK_MUTATION_KEY,
    mutationFn: fetchApiClientIndexToHyperlink,
    onSuccess: (response) => {
      console.log("Mutation successful: ", response);
      reactQueryClient.invalidateQueries({
        queryKey: ["getHistoryFilesByConversations"],
      });
      reactQueryClient.invalidateQueries({
        queryKey: ["getHistoryHyperlinksByConversation"],
      });
      reactQueryClient.invalidateQueries({
        queryKey: ["getTemporaryHyperlinks"],
      });
    },
    onError: (error) => {
      console.error("Hyperlink mutation error:", error);
    },
  });
};
