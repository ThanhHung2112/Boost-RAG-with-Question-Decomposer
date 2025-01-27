"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

import { LazyLoading } from "@/components/lazyloading";
import { setLoading } from "@/lib/features/viewPdf/loadPdfSlice";

const ViewPdf = dynamic(
  () =>
    import("@/components/chatbot/components/view-pdf").then(
      (mod) => mod.ViewPdf,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[calc(100vh)] w-[600px] flex justify-center items-center">
        <LazyLoading />
      </div>
    ),
  },
);

interface ViewPdfLayoutProps {
  children: React.ReactNode;
}

const ViewPdfLayout: React.FC<ViewPdfLayoutProps> = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setLoading(false));
  }, [dispatch]);

  return (
    <div className="flex h-full">
      <div className="w-[600px] h-[calc(100vh)] bg-gray-50 dark:bg-gray-800">
        <ViewPdf />
      </div>
      <main className="flex-grow bg-white dark:bg-gray-900 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default ViewPdfLayout;
