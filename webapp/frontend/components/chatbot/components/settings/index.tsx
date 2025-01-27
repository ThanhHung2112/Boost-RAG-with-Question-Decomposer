"use client";

import { IoSettingsOutline } from "react-icons/io5";
import { useState } from "react";

import { SettingModal } from "./components";

export const Settings = ({ hintLabel }: { hintLabel: boolean }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="flex-col rounded-lg space-y-2">
        <button
          className="w-full flex outline-none block text-white font-medium rounded-lg text-sm text-center hover:text-blue-700"
          type="button"
          onClick={openModal}
        >
          <IoSettingsOutline className="w-6 h-6 text-gray-400 hover:text-gray-500" />
          {hintLabel && <span className="ml-3 text-gray-800">Settings</span>}
        </button>
      </div>
      <SettingModal closeModal={closeModal} isModalOpen={isModalOpen} />
    </>
  );
};
