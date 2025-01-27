import { useMutation } from "@tanstack/react-query";

import { reactQueryClient } from "@/services/react-query.service";
import { getTemporaryHyperlinks } from "@/shared/api/temporary";

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
};

const TEMPORARY_INDEX_TO_HYPERLINK_MUTATION_KEY = ["temporaryIndexToHyperlink"];

const fetchApiTemporaryIndexToHyperlink = async ({
  conversationId,
}: ParamsHyperlink): Promise<any> => {
  const temporaryHyperlink = await getTemporaryHyperlinks();

  try {
    if (conversationId) {
      console.log(temporaryHyperlink);

      // const historyHyperlinkReponse = await postHyperlinks(
      //     conversationId,
      //     data
      // );

      // const newHyperlink = {
      //     id: uuidv4(),
      //     title: hyperlinkTitle.titleUrl,
      //     conversationId,
      //     link: data.link,
      //     createdTime: formatDateTime(new Date()),
      // };

      // let formData = new FormData();

      // formData.append("chatID", conversationId);
      // formData.append('docID', newHyperlink.id);
      // formData.append('url', newHyperlink.link);
      // formData.append('base64_file', '');
      // formData.append('is_base64', 'false');

      // let { job_id } = await postIndexPdf(formData);

      // if (!isKeyInSession("hisHyperlink")) {
      //     saveDataToSession("hisHyperlink", [
      //         {
      //             conversationId,
      //             items: [
      //                 {
      //                     id: historyHyperlinkReponse.id,
      //                     jobID: job_id,
      //                 },
      //             ],
      //         },
      //     ]);
      // } else {
      //     const sessionKey = "hisHyperlink";
      //     let sessionData = getDataSession(sessionKey);

      //     if (!Array.isArray(sessionData)) {
      //         sessionData = [];
      //     }

      //     const existingEntryIndex = sessionData.findIndex(
      //         (entry: any) => entry.conversationId === conversationId,
      //     );

      //     if (existingEntryIndex !== -1) {
      //         const existingItems = sessionData[existingEntryIndex].items;
      //         const newItems = historyHyperlinkReponse.items.map(
      //             (item: any) => ({
      //                 id: item,
      //                 jobID: job_id,
      //             }),
      //         );

      //         sessionData[existingEntryIndex].items = [
      //             ...existingItems,
      //             ...newItems,
      //         ].reduce((acc: any[], current: any) => {
      //             if (!acc.some((item) => item.id === current.id)) {
      //                 acc.push(current);
      //             }

      //             return acc;
      //         }, []);
      //     } else {
      //         const newItems = historyHyperlinkReponse.items.map(
      //             (item: any) => ({
      //                 id: item,
      //                 jobID: job_id,
      //             }),
      //         );

      //         sessionData.push({
      //             conversationId,
      //             items: newItems,
      //         });
      //     }

      //     saveDataToSession(sessionKey, sessionData);
      // }
    }
  } catch (error) {
    console.error("Error in fetchApiClientIndexToHyperlink:", error);
    throw error;
  }
};

export const useTemporaryIndexToHyperlink = () => {
  return useMutation<
    { historyResponse: any; conversationId: string } | void,
    Error,
    ParamsHyperlink
  >({
    mutationKey: TEMPORARY_INDEX_TO_HYPERLINK_MUTATION_KEY,
    mutationFn: fetchApiTemporaryIndexToHyperlink,
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
      console.log(error);
    },
  });
};
