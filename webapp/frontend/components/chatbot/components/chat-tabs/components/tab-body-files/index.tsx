import { usePathname } from "next/navigation";
import { MdDelete } from "react-icons/md";
import { useRouter } from "next/navigation";
import { FaFilePdf } from "react-icons/fa6";
import { Spinner } from "@nextui-org/react";
import { useEffect } from "react";

import { useAppStore } from "@/hooks";
import { turnOn } from "@/lib/features/viewPdf/viewPdfSlice";
import { ModalAction } from "@/components/modals";

import "@/styles/text-hover-scroll.css";
import { useFileContext } from "@/contexts/indexerPdf.provider";
import toast from "react-hot-toast";

export const TabBodyFiles = () => {
  const conversationId = usePathname().split("/")[2] || "";

  const router = useRouter();
  const { dispatch } = useAppStore();

  const handleActivate = (fileId: string) => {
    dispatch(turnOn({ isActiveViewPdf: true }));
    if (conversationId)
      router.push(`/c/${conversationId}/view-pdf?f=${fileId}.pdf`);
    else router.push(`/view-pdf?f=${fileId}.pdf`);
  };

  const {
    files,
    queueFilePDF,
    isFilesLoading,
    isFilesError,
    handleRemoveFile,
  } = useFileContext();

  useEffect(() => {
    console.log("Queue filePDF updated:", queueFilePDF);
  }, [queueFilePDF]);

  if (isFilesLoading) {
    return (
      <div className="flex items-center justify-center h-[180px]">
        <span className="text-center text-gray-400 text-sm">
          Loading files...
        </span>
      </div>
    );
  }

  if (isFilesError) {
    return (
      <div className="flex items-center justify-center h-[180px]">
        <span className="text-center text-gray-400 text-sm">
          Error loading files.
        </span>
      </div>
    );
  }

  return (
    <ul className="space-y-2 w-full max-h-[450px] overflow-y-auto scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thin scrollbar-thumb-dark:bg-gray-800 scrollbar-track-dark:bg-gray-800">
      {Array.isArray(files) && files.length > 0 ? (
        files.map((file: any) => (
          <li
            key={file.id}
            className="w-full rounded-lg border-b border-gray-200 last:border-b-0"
          >
            <div
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition duration-200 cursor-pointer"
              onClick={() => handleActivate(file.id)}
            >
              {queueFilePDF.some((item: any) => item.id === file.id) ? (
                <Spinner className="mr-2" color="default" size="sm" />
              ) : (
                <FaFilePdf className="text-gray-500 hover:text-gray-400" />
              )}

              <div className="blue-btn text-gray-600 text-sm">
                <span className="first-link inline-block decoration-blue-700 text-nowrap">
                  {file.originalName}
                </span>
              </div>

              <ModalAction
                customBody={
                  <>
                    <p className="text-sm text-gray-600">
                      Are you sure you want to delete this file pdf?
                    </p>
                  </>
                }
                customButtonShowModal={
                  <MdDelete className="w-5 h-5 text-gray-500 hover:text-gray-400" />
                }
                disabled={
                  !!queueFilePDF.some((item: any) => item.id === file.id)
                }
                labelAction={"Delete"}
                styleButtonShowModal={"text-gray-500"}
                title={"Delete chat?"}
                onAction={() => {
                  handleRemoveFile(file.id);
                  toast.success("File PDF deleted successfully.");
                }}
              />
            </div>
          </li>
        ))
      ) : (
        <div className="flex items-center justify-center h-[180px]">
          <span className="text-center text-gray-400 text-sm">
            No files have been uploaded within this conversation.
          </span>
        </div>
      )}
    </ul>
  );
};
