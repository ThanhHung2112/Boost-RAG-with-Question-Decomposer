import { Tooltip } from "@nextui-org/react";
import { LuPanelLeftOpen } from "react-icons/lu";
import { IoSettingsOutline } from "react-icons/io5";

import { ButtonNewChat } from "../button-new-chat";

interface SlidebarClosedProps {
  onOpenSlidebar: () => void;
  onOpenSettings: () => void;
}

export const SlidebarClosed = ({
  onOpenSlidebar,
  onOpenSettings,
}: SlidebarClosedProps) => {
  return (
    <aside className="w-[70px] border-r border-gray-200 h-screen py-2">
      <div className="h-full py-2 overflow-y-auto bg-white dark:bg-gray-800">
        <ul className="space-y-3 font-medium flex flex-col justify-between items-center">
          <li className="h-[100px]">
            <div className="flex flex-col justify-center items-center space-y-5">
              <Tooltip
                color="default"
                content="Open Slidebar"
                placement="left-start"
              >
                <button
                  aria-label="Open Slidebar"
                  className="bg-white outline-none"
                  onClick={onOpenSlidebar}
                >
                  <LuPanelLeftOpen className="w-6 h-6 text-gray-400 hover:text-gray-500" />
                </button>
              </Tooltip>
              <Tooltip
                color="default"
                content="New chat"
                placement="left-start"
              >
                <ButtonNewChat hintLabel={false} />
              </Tooltip>
            </div>
          </li>

          <li className="absolute bottom-0 py-4">
            <Tooltip color="default" content="Settings" placement="left-start">
              <button
                aria-label="Open settings"
                className="outline-none flex justify-center"
                onClick={onOpenSettings}
              >
                <IoSettingsOutline className="w-6 h-6 text-gray-400 hover:text-gray-500" />
              </button>
            </Tooltip>
          </li>
        </ul>
      </div>
    </aside>
  );
};
