import { BsRobot } from "react-icons/bs";

import { DotTyping } from "../../../loaders/dot-loading";
import "@/styles/animations/text-linear-color.css";

export const ChatLoading = () => {
  return (
    <div className="mt-4 mb-4 flex items-center text-[#0D0D0D]">
      <span className="rounded-full h-[24px] w-[24px] bg-white flex items-center justify-center">
        <BsRobot className="text-[#0D0D0D] h-full w-full" />
      </span>
      <p className="ml-4 rounded-lg p-3 flex items-end text-gray-800">
        <span className="mr-3 semibold text-[#ccc] animated-text">
          RAGSY is thinking
        </span>
        <div className="mb-1">
          <DotTyping />
        </div>
      </p>
    </div>
  );
};
