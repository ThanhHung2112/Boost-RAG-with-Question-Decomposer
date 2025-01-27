"use client";

import Link from "next/link";
import { IoSettingsOutline } from "react-icons/io5";
import { IoCloseSharp } from "react-icons/io5";

//Hooks
import { useAppSelector } from "@/hooks";

export const SettingModal = ({
  isModalOpen,
  closeModal,
}: {
  isModalOpen: boolean;
  closeModal: any;
}) => {
  const botConfig = useAppSelector((state) => state.botConfig);

  console.log(botConfig);

  return (
    <>
      {isModalOpen && (
        <div className="absolute left-0 top-0 bottom-0 right-0 flex items-center justify-center bg-black bg-opacity-50 w-screen z-[1000]">
          <div className="relative p-4 w-full max-w-2xl max-h-full bg-white rounded-lg shadow dark:bg-gray-700">
            <div className="w-full">
              <div className="flex justify-between items-center p-2 border-b">
                <h2 className="text-xl font-semibold">Settings</h2>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={closeModal}
                >
                  <Link href="">
                    <IoCloseSharp />
                  </Link>
                </button>
              </div>

              <div className="flex">
                <div className="w-1/4 space-y-3 mt-4 my-2 ">
                  <ul className="space-y-2">
                    <li>
                      <button className="flex items-center text-white font-medium space-x-2 hover:bg-gray-200 p-2 w-full rounded-lg">
                        <IoSettingsOutline className="text-gray-700" />
                        <span className="text-gray-700">General</span>
                      </button>
                    </li>
                  </ul>
                </div>

                <div className="w-3/4 space-y-3 mt-4 my-2 ml-3">
                  <div className="flex justify-between items-center">
                    <span>Theme</span>
                    <select className="p-2 rounded-lg dark:bg-gray-700">
                      <option>Light</option>
                      <option>Dark</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Model Language</span>
                    <select className="p-2 rounded-lg dark:bg-gray-700">
                      <option>Auto-detect</option>
                      <option>Vietnamese</option>
                      <option>English (US)</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Di</span>
                    <select className="p-2 rounded-lg dark:bg-gray-700">
                      <option>Vietnamese</option>
                      <option>English (US)</option>
                    </select>
                  </div>

                  {/* <div className="flex justify-between items-center">
                    <span>Delete all chats</span>
                    <button className="border p-2 rounded-lg bg-gray-300 hover:bg-gray-500 text-white text-sm">
                      <MdOutlineCleaningServices />
                    </button>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
