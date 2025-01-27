import { ModelLabels, ModelType } from "@/constants";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { setModel } from "@/lib/features/botConfig/botConfigSlice";

export const SelectModels = () => {
  const model = useAppSelector((state) => state.botConfig.model);

  const dispatch = useAppDispatch();

  return (
    <div className="flex justify-between items-center">
      <span className="text-sm">Model</span>
      <select
        className="p-2 rounded-lg dark:bg-gray-700 text-sm w-[140px]"
        value={model}
        onChange={(e) => dispatch(setModel(e.target.value))}
      >
        {Object.entries(ModelType).map(([key, value]) => (
          <option key={key} value={value}>
            {ModelLabels[key as keyof typeof ModelType]}
          </option>
        ))}
      </select>
    </div>
  );
};
