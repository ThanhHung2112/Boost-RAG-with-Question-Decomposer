import { LuPanelLeftClose } from "react-icons/lu";
import Link from "next/link";
import { IoSettingsOutline } from "react-icons/io5";

import { ButtonNewChat } from "../button-new-chat";

export const HeaderSlidebar = ({
  onClose,
  onOpenSettings,
}: {
  onClose: () => void;
  onOpenSettings: () => void;
}) => {
  return (
    <div className="h-[100px]">
      <div className="flex justify-between items-center">
        <Link className="flex md:me-24 py-4" href="/">
          <span className="self-center font-semibold text-gray-400 text-lg">
            {process.env.NEXT_PUBLIC_APP_NAME || "DefaultAppName"}
          </span>
        </Link>
        <ul className="flex items-center space-x-2">
          <li>
            <button
              aria-label="Open settings"
              className="outline-none flex justify-center items-center"
              onClick={onOpenSettings}
            >
              <IoSettingsOutline className="w-6 h-6 text-gray-400 hover:text-gray-500" />
            </button>
          </li>
          <li>
            <button
              aria-label="Close Slidebar"
              className="outline-none flex justify-center items-center"
              onClick={onClose}
            >
              <LuPanelLeftClose className="w-6 h-6 text-gray-400 hover:text-gray-500" />
            </button>
          </li>
        </ul>
      </div>
      <div className="flex space-x-3">
        <ButtonNewChat hintLabel={true} />
      </div>
    </div>
  );
};
