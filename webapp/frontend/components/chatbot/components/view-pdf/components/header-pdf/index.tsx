import { useRouter, useSearchParams } from "next/navigation";
import { FaFilePdf } from "react-icons/fa";
import { IoCloseCircle } from "react-icons/io5";

import { turnOff } from "@/lib/features/viewPdf/viewPdfSlice";
import { useAppDispatch } from "@/hooks";

export const HeaderPdf = () => {
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleDeactivate = () => {
    dispatch(turnOff({ isActiveViewPdf: false }));
    router.push("./");
  };

  return (
    <div className="flex justify-between items-center bg-white shadow-md border-b border-gray-200 h-[38px] px-2">
      <div className="flex items-center space-x-3">
        <FaFilePdf className="w-6 h-6 text-red-500" />
        <h2 className="text-sm font-semibold text-gray-800 overflow-hidden text-ellipsis whitespace-nowrap">
          {searchParams.get("f")}
        </h2>
      </div>
      <button
        className="text-gray-400 hover:text-gray-700 transition-colors duration-200"
        onClick={handleDeactivate}
      >
        <IoCloseCircle className="w-6 h-6" />
      </button>
    </div>
  );
};
