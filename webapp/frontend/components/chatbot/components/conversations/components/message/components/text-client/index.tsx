import { BsRobot } from "react-icons/bs";

export const TextClient = ({ ...props }) => {
  const { context, isIconUser } = props;

  return (
    <>
      <div className="mt-4 mb-4 flex justify-end text-[#0D0D0D]">
        {isIconUser && (
          <span className="material-symbols-outlined text-white bg-purple-600 p-2 rounded h-[30px] w-[30px]">
            <BsRobot className="h-full w-full" />
          </span>
        )}
        <p className="ml-3 p-3 rounded-lg bg-[#F4F4F4] relative">
          {context}
          <span className="absolute bottom-[-5px] right-0 w-0 h-0 border-l-[20px] border-t-[10px] border-l-transparent border-t-[#F4F4F4]" />
        </p>
      </div>
    </>
  );
};
