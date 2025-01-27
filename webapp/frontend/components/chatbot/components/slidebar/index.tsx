"use client";

import { useState } from "react";

import { HeaderSlidebar, MainSlidebar, SlidebarClosed } from "./components";

import { useAppDispatch } from "@/hooks";
import { turnOn } from "@/lib/features/modalControl/viewModalSlice";
import { turnOff } from "@/lib/features/viewPdf/viewPdfSlice";

export const Slidebar = () => {
  const [isSlidebarOpen, setIsSlidebarOpen] = useState(true);
  const dispatch = useAppDispatch();

  const handleOpenSlidebar = () => setIsSlidebarOpen(true);
  const handleOpenSettings = () =>
    dispatch(turnOn({ isActiveViewModal: true }));

  return (
    <>
      {isSlidebarOpen ? (
        <aside className="w-[400px] h-screen bg-gray-100 transition-transform border-r border-gray-200 sm:translate-x-0">
          <div className="h-full overflow-y-auto no-scrollbar px-3 bg-white dark:bg-gray-800">
            <div className="space-y-2 font-medium">
              <HeaderSlidebar
                onClose={function (): void {
                  setIsSlidebarOpen(false);
                  dispatch(turnOff({ isActiveViewModal: false }));
                }}
                onOpenSettings={handleOpenSettings}
              />
              <MainSlidebar />
            </div>
          </div>
        </aside>
      ) : (
        <SlidebarClosed
          onOpenSettings={handleOpenSettings}
          onOpenSlidebar={handleOpenSlidebar}
        />
      )}
    </>
  );
};
