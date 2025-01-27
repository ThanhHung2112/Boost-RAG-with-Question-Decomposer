import { useMutation } from "@tanstack/react-query";

import { reactQueryClient } from "@/services/react-query.service";
import { postHistoryFilesBulk } from "@/shared/api/history-files";
import { postHyperlinks } from "@/shared/api/hyperlinks";
import {
  deleteDocs,
  deleteTemporaryHyperlinks,
  getFilesTemporary,
  getTemporaryHyperlinks,
} from "@/shared/api/temporary";
import { postIndexPdf } from "@/shared/services/chatbot";
import {
  getDataSession,
  saveDataToSession,
} from "@/states/session/dataSession";
import { fetchApi } from "@/utils";

interface File {
  id: string;
  originalName: string;
}

interface Hyperlink {
  id: string;
  link: string;
}

const processTemporaryFiles = async (conversationId: string) => {
  try {
    const temporaryFiles: File[] = await getFilesTemporary();

    if (temporaryFiles.length === 0) return [];

    await postHistoryFilesBulk(conversationId, { data: temporaryFiles });

    const fileProcessingResults = await Promise.all(
      temporaryFiles.map(async (file, index) => {
        try {
          await deleteDocs(file.id, "SoftDeleted");

          const uploadResponse = await fetchApi({
            method: "POST",
            url: `/api/uploadfile/${file.id}`,
            data: {
              chatID: conversationId,
              docID: file.id,
              url: "",
              base64_file: "",
              is_base64: false,
            },
          });

          const formData = new FormData();

          formData.append("file", new Blob([uploadResponse?.data]), file.id);
          formData.append("chatID", conversationId);
          formData.append("docID", file.id);
          formData.append("url", "");
          formData.append("base64_file", "");
          formData.append("is_base64", "false");

          const indexResponse = await postIndexPdf(formData);

          return {
            fileId: file.id,
            jobId: indexResponse.job_id,
            fileName: temporaryFiles[index].originalName,
          };
        } catch (error) {
          console.error(`Error processing file ${file.id}:`, error);

          return null;
        }
      }),
    );

    const successfulProcessing = fileProcessingResults.filter(
      (result) => result !== null,
    );

    const sessionKey = process.env.NEXT_PUBLIC_KEY_SESSION_PDF || "hisFilePDF";
    let sessionData = getDataSession(sessionKey) || [];

    const newItems = successfulProcessing.map((result) => ({
      id: result.fileId,
      jobID: result.jobId,
      fileName: result.fileName,
    }));

    const existingEntryIndex = sessionData.findIndex(
      (entry: any) => entry.conversationId === conversationId,
    );

    if (existingEntryIndex !== -1) {
      sessionData[existingEntryIndex].items = [
        ...sessionData[existingEntryIndex].items,
        ...newItems,
      ];
    } else {
      sessionData.push({
        conversationId,
        items: newItems,
      });
    }

    saveDataToSession(sessionKey, sessionData);

    return successfulProcessing;
  } catch (error) {
    console.error("Error processing temporary files:", error);
    throw error;
  }
};

const processTemporaryHyperlinks = async (conversationId: string) => {
  try {
    const temporaryHyperlinks: Hyperlink[] = await getTemporaryHyperlinks();

    if (temporaryHyperlinks.length === 0) return [];

    const hyperlinkProcessingResults = await Promise.all(
      temporaryHyperlinks.map(async (hyperlink) => {
        try {
          await postHyperlinks(conversationId, hyperlink);

          const formData = new FormData();

          formData.append("chatID", conversationId);
          formData.append("docID", hyperlink.id);
          formData.append("url", hyperlink.link);
          formData.append("base64_file", "");
          formData.append("is_base64", "false");

          const indexResponse = await postIndexPdf(formData);

          // let indexResponse: any;
          // let mode = true;

          // if (mode) {
          //   console.log("Dev mode test");
          //   const { jobID } = await postJobClientIndexDataPriority(formData);
          //   indexResponse = {
          //     job_id: jobID
          //   };
          //   console.log("Dev mode test job_id", jobID);
          // }
          // else {
          //   const response = await postIndexPdf(formData);
          //   indexResponse = {
          //     job_id: response.job_id
          //   };
          // }

          return {
            hyperlinkId: hyperlink.id,
            jobId: indexResponse.job_id,
            link: hyperlink.link,
          };
        } catch (error) {
          console.error(`Error processing hyperlink ${hyperlink.id}:`, error);

          return null;
        }
      }),
    );

    const successfulProcessing = hyperlinkProcessingResults.filter(
      (result) => result !== null,
    );

    const sessionKey =
      process.env.NEXT_PUBLIC_KEY_SESSION_HYPERLINK || "hisHyperlink";
    let sessionData = getDataSession(sessionKey) || [];

    const newItems = successfulProcessing.map((result) => ({
      id: result.hyperlinkId,
      jobID: result.jobId,
      hyperlink: result.link,
    }));

    const existingEntryIndex = sessionData.findIndex(
      (entry: any) => entry.conversationId === conversationId,
    );

    if (existingEntryIndex !== -1) {
      sessionData[existingEntryIndex].items = [
        ...sessionData[existingEntryIndex].items,
        ...newItems,
      ];
    } else {
      sessionData.push({
        conversationId,
        items: newItems,
      });
    }

    saveDataToSession(sessionKey, sessionData);

    await Promise.all(
      temporaryHyperlinks.map(({ id }) => deleteTemporaryHyperlinks(id)),
    );

    return successfulProcessing;
  } catch (error) {
    console.error("Error processing temporary hyperlink:", error);
    throw error;
  }
};

const handleSnapshotData = async (conversationId: string): Promise<void> => {
  try {
    await Promise.all([
      processTemporaryFiles(conversationId),
      processTemporaryHyperlinks(conversationId),
    ]);
  } catch (error) {
    console.error("Error processing snapshot data:", error);
    throw error;
  }
};

export const useSnapshotData = () => {
  return useMutation({
    mutationKey: ["snapShotData"],
    mutationFn: handleSnapshotData,
    onSuccess: () => {
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
      console.error("Error mutation snapshot data:", error);
    },
  });
};
