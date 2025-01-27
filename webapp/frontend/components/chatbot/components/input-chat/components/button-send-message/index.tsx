import { FaArrowCircleUp } from "react-icons/fa";

export const ButtonSendMessage = ({
  textMessage,
  onSendMessage,
  stateResponse,
}: {
  textMessage: string;
  onSendMessage: () => void;
  stateResponse: boolean;
}) => {
  return (
    <button
      className={`${
        textMessage.trim() === "" || stateResponse
          ? "text-gray-300 cursor-not-allowed"
          : "text-gray-300 hover:text-gray-500"
      } focus:outline-none transition duration-150 ease-in-out`}
      disabled={textMessage.trim() === ""}
      onClick={onSendMessage}
    >
      <FaArrowCircleUp
        className={`${
          textMessage.trim() === "" || stateResponse
            ? "text-gray-300"
            : "text-gray-400 hover:text-gray-500"
        } transition duration-150 ease-in-out`}
        size={24}
      />
    </button>
  );
};
