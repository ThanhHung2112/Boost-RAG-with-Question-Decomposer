import { BsRobot } from "react-icons/bs";

import { Remark } from "../../../remark";

export const TextBot = ({ ...props }) => {
  const { defaultContext, context, dialogueOrder } = props;

  return (
    <div className="mt-4 mb-4 flex items-start text-[#0D0D0D]">
      <span className="rounded h-[24px] w-[24px] bg-white flex items-start justify-start">
        <BsRobot className="text-[#0D0D0D] h-full w-full" />
      </span>
      <p className="ml-4 rounded-lg w-full">
        <Remark
          markdownContext={dialogueOrder === -1 ? defaultContext : context}
        />
      </p>
    </div>
  );
};
