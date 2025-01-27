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
      <div className="h-[calc(100vh)]">
        <LazyLoading />
      </div>
    ),
  },
);

const ViewPdfLayout = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setLoading(false));
  }, [dispatch]);

  return (
    <div className="flex w-full">
      <ViewPdf />
      <main className="w-full">{children}</main>
    </div>
  );
};

export default ViewPdfLayout;
