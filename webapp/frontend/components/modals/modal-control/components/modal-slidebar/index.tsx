import { IoSettingsOutline } from "react-icons/io5";

export const ModalSidebar = () => {
  return (
    <div className="w-1/4 space-y-3 mt-4 my-2 border-r-2 border-gray-200">
      <ul className="space-y-2 mr-2">
        <li>
          <button className="flex items-center text-white font-medium space-x-2 hover:bg-gray-200 p-2 w-full rounded-lg">
            <IoSettingsOutline className="text-gray-700" />
            <span className="text-gray-700 text-sm">General</span>
          </button>
        </li>
      </ul>
    </div>
  );
};
