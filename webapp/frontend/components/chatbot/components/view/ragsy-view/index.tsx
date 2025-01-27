"use client";

import { Slidebar } from "../../slidebar";

export const RagsyView = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex">
      <Slidebar />
      <div className="w-full">{children}</div>
    </div>
  );
};
