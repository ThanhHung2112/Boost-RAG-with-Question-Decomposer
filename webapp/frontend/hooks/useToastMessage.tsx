"use client";

import { Toaster, toast } from "react-hot-toast";

export const useToastMessage = () => {
  const Notification = (
    <Toaster
      containerClassName=""
      containerStyle={{}}
      gutter={8}
      position="top-center"
      reverseOrder={false}
      toastOptions={{
        className: "",
        duration: 5000,
        style: {
          background: "#363636",
          color: "#fff",
        },
        success: {
          duration: 3000,
        },
      }}
    />
  );

  return { Notification, toast };
};
