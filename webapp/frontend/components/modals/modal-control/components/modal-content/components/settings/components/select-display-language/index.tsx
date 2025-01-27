import { Language, LanguageLabels } from "@/constants/display";

export const SelectDisplayLanguage = () => {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm">Display Language</span>
      <select className="p-2 rounded-lg dark:bg-gray-700 text-sm w-[140px]">
        {Object.entries(Language).map(([key, value]) => (
          <option key={key} value={value}>
            {LanguageLabels[key as keyof typeof Language]}
          </option>
        ))}
      </select>
    </div>
  );
};
