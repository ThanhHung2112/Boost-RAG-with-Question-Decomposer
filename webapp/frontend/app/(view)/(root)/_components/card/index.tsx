import { FaChartBar } from "react-icons/fa6";

export const Card = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <div className="bg-[#F9F9F9] dark:bg-gray-900 p-6 rounded-lg w-48 flex flex-col items-center space-y-4 border">
      <FaChartBar className="text-gray-300 w-6 h-6" />
      <h3 className="text-sm text-gray-600 dark:text-gray-300 text-center">
        {title}
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        {description}
      </p>
    </div>
  );
};
