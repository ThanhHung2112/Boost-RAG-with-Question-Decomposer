import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { IoChatbox } from "react-icons/io5";
import { MdDelete } from "react-icons/md";
import { Divider } from "@nextui-org/react";

import { ModalAction } from "@/components/modals";
import { useToastMessage } from "@/hooks/useToastMessage";
import { useGetConversations } from "@/hooks/useGetConversations";
import { useDeleteConversations } from "@/hooks/useDeleteConversations";

import "@/styles/animations/text-linear-color.css";

export const HistoryConversations = () => {
  const [hoveredId, setHoveredId] = useState(null);
  const conversationId = usePathname().split("/")[2];

  const {
    data: conversations,
    isLoading: isConversationsLoading,
    isError: isErrorConversations,
  } = useGetConversations();

  const { mutate: mutateDeleteConversations } = useDeleteConversations();
  const router = useRouter();
  const { Notification, toast } = useToastMessage();

  const handleDeleteConversation = async (conversationId: string) => {
    mutateDeleteConversations(conversationId, {
      onSuccess: () => {
        router.push("/");
        toast.success("Conversation deleted successfully.");
      },
    });
  };

  if (isErrorConversations) {
    return <div>Error loading conversations</div>;
  }

  return (
    <>
      {Array.isArray(conversations) &&
        conversations.map((conversation: any, index: number) => (
          <aside key={conversation.id}>
            <div
              key={conversation.id}
              className={`
                ${conversation.id === conversationId ? "bg-gray-100" : ""}
                ${hoveredId === conversation.id ? "bg-gray-200" : ""}
                flex items-center justify-between 
                p-2 rounded-lg 
                cursor-pointer
                focus:outline-none
                focus:ring-gray-300 
                hover:bg-gray-100 
                focus:bg-gray-100
                transition-colors duration-200
              `}
              role="button"
              tabIndex={0}
              onMouseEnter={() => setHoveredId(conversation.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => setHoveredId(conversation.id)}
            >
              <Link
                className="flex items-center flex-1 gap-3 p-2 rounded-lg"
                href={`/c/${conversation.id}`}
              >
                <IoChatbox
                  className={`w-5 h-5 
                    ${hoveredId === conversation.id ? 'text-gray-900' : 'text-gray-500'}
                    transition-colors duration-200`}
                />

                {conversation.conversationName === "New conversation" ? (
                  <span
                    className={`
                      ${hoveredId === conversation.id ? 'text-gray-900' : 'text-gray-800'}
                      dark:text-white text-sm mr-3 animated-text
                      transition-colors duration-200
                    `}
                  >
                    {conversation.conversationName}
                  </span>
                ) : (
                  <span
                    className={`
                      ${hoveredId === conversation.id ? 'text-gray-900' : 'text-gray-800'}
                      dark:text-white text-sm
                      transition-colors duration-200
                    `}
                  >
                    {conversation.conversationName}
                  </span>
                )}
              </Link>

              <div
                className="flex items-center"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <ModalAction
                  customBody={
                    <p className="text-sm text-gray-600">
                      Are you sure you want to delete this chat?
                    </p>
                  }
                  customButtonShowModal={
                    <MdDelete
                      className={`w-5 h-5 
                        ${hoveredId === conversation.id ? 'text-gray-600' : 'text-gray-500'}
                        hover:text-red-600 
                        transition-colors duration-200`}
                    />
                  }
                  labelAction={"Delete"}
                  styleButtonShowModal={"text-gray-500 hover:text-red-600"}
                  title={"Delete chat?"}
                  onAction={() => handleDeleteConversation(conversation.id)}
                />
              </div>
            </div>
            <Divider />
          </aside>
        ))}
    </>
  );
};
