import { Button } from "@nextui-org/button";
import { useRouter } from "next/navigation";
import { FaPlus } from "react-icons/fa";
import { IoChatbubbleEllipses } from "react-icons/io5";

import { useToastMessage } from "@/hooks/useToastMessage";

interface ButtonNewChatProps {
  hintLabel: boolean;
}

export const ButtonNewChat: React.FC<ButtonNewChatProps> = ({ hintLabel }) => {
  const router = useRouter();
  const { toast } = useToastMessage();

  const handleNewChat = async () => {
    try {
      router.push("/c");
      toast.success("Start chatting by typing your message!");
    } catch (error) {
      console.error("Failed to initiate new chat:", error);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleNewChat();
    }
  };

  return hintLabel ? (
    <Button
      aria-label="Start a new chat"
      className="cursor-pointer bg-gray-300 hover:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg w-full"
      onClick={handleNewChat}
    >
      <div className="flex items-center space-x-2">
        <FaPlus className="w-4 h-4" />
        <span className="text-sm text-white">New Chat</span>
      </div>
    </Button>
  ) : (
    <div
      aria-label="Start a new chat"
      className="cursor-pointer text-gray-400 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
      role="button"
      tabIndex={0}
      onClick={handleNewChat}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center space-x-2">
        <IoChatbubbleEllipses className="w-6 h-6 text-gray-400" />
      </div>
    </div>
  );
};
