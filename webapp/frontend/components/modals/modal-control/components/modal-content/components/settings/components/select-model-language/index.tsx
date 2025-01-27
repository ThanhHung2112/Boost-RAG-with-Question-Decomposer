import { LanguageLabels, ModelLanguage } from "@/constants";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { setModelLanguage } from "@/lib/features/botConfig/botConfigSlice";

export const SelectModelLanguage = () => {
  const modelLanguage = useAppSelector(
    (state) => state.botConfig.modelLanguage,
  );
  const dispatch = useAppDispatch();

  return (
    <div className="flex justify-between items-center">
      <span className="text-sm">Model Language</span>
      <select
        className="p-2 rounded-lg dark:bg-gray-700 text-sm w-[140px]"
        value={modelLanguage}
        onChange={(e: any) => dispatch(setModelLanguage(e.target.value))}
      >
        {Object.entries(ModelLanguage).map(([key, value]) => (
          <option key={key} value={value}>
            {LanguageLabels[key as keyof typeof ModelLanguage]}
          </option>
        ))}
      </select>
    </div>
  );
};
