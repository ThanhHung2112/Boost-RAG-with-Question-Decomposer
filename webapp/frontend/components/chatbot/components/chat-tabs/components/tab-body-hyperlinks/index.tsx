import { usePathname } from "next/navigation";
import { MdDelete } from "react-icons/md";
import { FaLink } from "react-icons/fa6";
import { Spinner } from "@nextui-org/react";

import { ModalAction } from "@/components/modals";

import "@/styles/text-hover-scroll.css";

import { useHyperlinkContext } from "@/contexts/hyperlink.provider";

import { useEffect } from "react";

import { useAppSelector } from "@/hooks";
import toast from "react-hot-toast";

const HyperlinkItem = ({
  link,
  isProcessing,
  onRemove,
  onRedirect,
}: {
  link: any;
  isProcessing: boolean;
  onRemove: (id: string) => void;
  onRedirect: (link: string) => void;
}) => (
  <li className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 transition duration-200 border-b border-gray-200 last:border-b-0">
    {isProcessing ? (
      <Spinner className="mr-2" color="default" size="sm" />
    ) : (
      <FaLink className="text-gray-500 hover:text-gray-400" />
    )}
    <div
      className="blue-btn text-gray-600 text-sm"
      onClick={() => onRedirect(link?.link)}
    >
      <a
        className="first-link inline-block underline decoration-gray-500 underline-offset-2 hover:underline"
        href={link?.link}
        rel="noopener noreferrer"
        target="_blank"
      >
        {link?.title}
      </a>
    </div>
    <ModalAction
      customBody={
        <p className="text-sm text-gray-600">
          Are you sure you want to delete this hyperlink?
        </p>
      }
      customButtonShowModal={
        <MdDelete className="w-5 h-5 text-gray-500 hover:text-gray-400" />
      }
      disabled={isProcessing}
      labelAction={"Delete"}
      styleButtonShowModal={"text-gray-500"}
      title={"Delete hyperlink?"}
      onAction={() => onRemove(link?.id)}
    />
  </li>
);

const HyperlinkList = () => {
  const conversationId = usePathname().split("/")[2];
  const { hyperlinks, isLoading, isError, queueHyperlink, removeHyperlink } =
    useHyperlinkContext();

  const isActiveDevMode = useAppSelector(
    (state) => state.devMode.isActiveDevMode,
  );

  useEffect(() => {
    console.log("Queue hyperlink updated:", queueHyperlink);
  }, [queueHyperlink]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading hyperlinks</div>;
  }

  return (
    <ul>
      {Array.isArray(hyperlinks) && hyperlinks.length > 0 ? (
        hyperlinks.map((link: any) => (
          <HyperlinkItem
            key={link.id}
            isProcessing={queueHyperlink.some(
              (item: any) => item.id === link.id,
            )}
            link={link}
            onRedirect={(url: string) => window.open(url, "_blank")}
            onRemove={(id: string) => {
              removeHyperlink(conversationId, id);
              toast.success("Hyperlink deleted successfully.");
            }}
          />
        ))
      ) : (
        <div className="flex items-center justify-center h-[180px]">
          <span className="text-center text-gray-400 text-sm">
            No files have been hyperlinks within this conversation.
          </span>
        </div>
      )}
    </ul>
  );
};

export const TabBodyHyperlinks = () => {
  return <HyperlinkList />;
};
