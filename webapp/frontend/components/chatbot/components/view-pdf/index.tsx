"use client";

import { Worker } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useDispatch } from "react-redux";

import { HeaderPdf } from "./components";

import { LazyLoading } from "@/components/lazyloading";
import { setLoading } from "@/lib/features/viewPdf/loadPdfSlice";

const Viewer = dynamic(
  () => import("@react-pdf-viewer/core").then((mod) => mod.Viewer),
  {
    ssr: false,
    loading: () => <LazyLoading />,
  },
);

export const ViewPdf = () => {
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const searchParams = useSearchParams();
  const fileUrl = `${process.env.NEXT_PUBLIC_CHAT_APP}/uploads/${searchParams.get("f")}`;
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const preloadWorker = async () => {
      try {
        await fetch(
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
        );
        dispatch(setLoading(false));
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to preload PDF worker:", error);
      }
    };

    preloadWorker();
  }, []);

  return (
    <div>
      {isLoading ? (
        <div className="h-[calc(100vh)] w-[600px] flex justify-center items-center">
          <LazyLoading />
        </div>
      ) : (
        <>
          <HeaderPdf />
          <Worker workerUrl="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js">
            <div className="h-[calc(100vh-56px)] w-[600px]">
              <Viewer
                fileUrl={fileUrl}
                plugins={[defaultLayoutPluginInstance]}
              />
            </div>
          </Worker>
        </>
      )}
    </div>
  );
};
