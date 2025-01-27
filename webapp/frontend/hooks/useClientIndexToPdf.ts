import { useMutation } from "@tanstack/react-query";

import { postHistoryFilesBulk } from "@/shared/api/history-files";
import { postMutipleFiles } from "@/shared/api/uploadfiles";
import { reactQueryClient } from "@/services/react-query.service";
import { postIndexPdf } from "@/shared/services/chatbot";
import { postDocsBulk } from "@/shared/api/temporary";
import {
  getDataSession,
  isKeyInSession,
  saveDataToSession,
} from "@/states/session/dataSession";
import { postJobClientIndexDataPriority } from "@/shared/api/jobs";

type ConversationFile = {
  id: string;
  conversationId: string;
  originalName: string;
  pathName: string;
  type: string;
  size: number;
  createdTime: string;
};

type TemporaryFile = {
  id: string;
  originalName: string;
  pathName: string;
  type: string;
  size: number;
  createdTime: string;
};

type ParamsFile = {
  formData: FormData;
  conversationId: string;
  data: any;
  type: string;
  mode: boolean;
  params: {
    topic_model: string | "FASTopic";
    language: string | "en";
  };
};

const CLIENT_INDEX_TO_PDF_MUTATION_KEY = ["clientIndexToPdf"];

const fetchApiClientIndexToPdf = async ({
  formData,
  conversationId,
  data,
  type,
  mode,
  params,
}: ParamsFile): Promise<{
  historyResponse: any;
  conversationId: string;
} | void> => {
  const getDevMode = (): boolean => {
    if (typeof window === "undefined") {
      return false;
    }

    const storedState = sessionStorage.getItem("isActiveDevMode");

    return storedState ? JSON.parse(storedState) : false;
  };

  try {
    if (type === "PDF") {
      const uploadResponse = await postMutipleFiles(formData);

      if (conversationId) {
        const historyResponse = await postHistoryFilesBulk(
          conversationId,
          data,
        );
        const files: File[] = [];

        Array.from(formData.entries()).forEach(([key, value]) => {
          if (key === "files" && value instanceof File) {
            files.push(value);
          }
        });

        var listJobID: string[] = [];

        const uploadPromises = files.map(async (file, index) => {
          let singleFile = new FormData();

          singleFile.append("chatID", conversationId);
          singleFile.append("docID", data.data[index].id);
          singleFile.append("file", file);
          singleFile.append("url", "");
          singleFile.append("base64_file", "");
          singleFile.append("is_base64", "false");

          const numberOfTopics = Array.from(formData.entries()).find(
            ([key]) => key === "number_of_topics",
          )?.[1];

          if (numberOfTopics) {
            const numberOfTopicsString = numberOfTopics.toString();
            const parsedNumberOfTopics = parseInt(numberOfTopicsString);

            if (!isNaN(parsedNumberOfTopics)) {
              const numberOfTopicsString = parsedNumberOfTopics.toString();

              singleFile.append("number_of_topics", numberOfTopicsString);
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
              singleFile,
              params,
            );

            job_id = jobID;
            console.log("Dev mode test job_id", jobID);
          } else {
            const response = await postIndexPdf(singleFile, params);

            job_id = response.job_id;
          }

          listJobID.push(job_id);
        });

        await Promise.all(uploadPromises);

        listJobID.forEach((job: any, index: number) => {
          if (
            !isKeyInSession(
              process.env.NEXT_PUBLIC_KEY_SESSION_PDF || "hisFilePDF",
            )
          ) {
            saveDataToSession(
              process.env.NEXT_PUBLIC_KEY_SESSION_PDF || "hisFilePDF",
              [
                {
                  conversationId,
                  items: [
                    {
                      id: historyResponse.items[index],
                      jobID: job,
                      fileName: data.data[index].originalName,
                    },
                  ],
                },
              ],
            );
          } else {
            const sessionKey =
              process.env.NEXT_PUBLIC_KEY_SESSION_PDF || "hisFilePDF";
            let sessionData = getDataSession(sessionKey);

            if (!Array.isArray(sessionData)) {
              sessionData = [];
            }

            const existingEntryIndex = sessionData.findIndex(
              (entry: any) => entry.conversationId === conversationId,
            );

            if (existingEntryIndex !== -1) {
              const existingItems = sessionData[existingEntryIndex].items;
              const newItems = historyResponse.items.map(
                (item: any, i: number) => ({
                  id: item,
                  jobID: job,
                  fileName: data.data[index].originalName,
                }),
              );

              sessionData[existingEntryIndex].items = [
                ...existingItems,
                ...newItems,
              ].reduce((acc: any[], current: any) => {
                if (!acc.some((item) => item.id === current.id)) {
                  acc.push(current);
                }

                return acc;
              }, []);
            } else {
              const newItems = historyResponse.items.map(
                (item: any, i: number) => ({
                  id: item,
                  jobID: job,
                  fileName: data.data[index].originalName,
                }),
              );

              sessionData.push({
                conversationId,
                items: newItems,
              });
            }

            saveDataToSession(sessionKey, sessionData);
          }
        });

        return {
          historyResponse,
          conversationId,
        };
      }

      if (!conversationId) {
        const historyResponse = await postDocsBulk({
          data: {
            items: [...data.data],
          },
        });

        return historyResponse;
      }

      return uploadResponse;
    }
  } catch (error) {
    console.error("Error in fetchApiClientIndexToPdf:", error);
    throw error;
  }
};

export const useClientIndexToPdf = () => {
  return useMutation<
    { historyResponse: any; conversationId: string } | void,
    Error,
    ParamsFile
  >({
    mutationKey: CLIENT_INDEX_TO_PDF_MUTATION_KEY,
    mutationFn: fetchApiClientIndexToPdf,
    onSuccess: (response) => {
      console.log("Mutation successful: ", response);
      reactQueryClient.invalidateQueries({
        queryKey: ["getHistoryFilesByConversations"],
      });
      reactQueryClient.invalidateQueries({
        queryKey: ["getHistoryHyperlinksByConversation"],
      });
      reactQueryClient.invalidateQueries({
        queryKey: ["getTemporaryFiles"],
      });
    },
    onError: (error) => {
      console.log(error);
    },
  });
};
