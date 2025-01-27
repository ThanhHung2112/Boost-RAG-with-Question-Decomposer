import classnames from "classnames";
import { ReactNode } from "react";

interface ModalContainerProps {
  isActive: boolean;
  children: ReactNode;
}

export const ModalContainer = ({ isActive, children }: ModalContainerProps) => {
  return (
    <div
      className={classnames(
        "fixed top-0 left-0 bottom-0 right-0 flex items-center justify-center bg-black bg-opacity-50 w-screen z-[1000]",
        isActive ? "block" : "hidden",
      )}
    >
      <div className="relative p-4 w-full max-w-2xl max-h-full bg-white rounded-lg shadow dark:bg-gray-700">
        {children}
      </div>
    </div>
  );
};
