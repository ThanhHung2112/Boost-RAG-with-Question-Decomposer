import { IoCloseSharp } from "react-icons/io5";

interface ModalHeaderProps {
  onClose: () => void;
}

export const ModalHeader = ({ onClose }: ModalHeaderProps) => {
  return (
    <div className="flex justify-between items-center p-2 border-b">
      <h2 className="text-xl font-semibold">Settings</h2>
      <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
        <IoCloseSharp />
      </button>
    </div>
  );
};
