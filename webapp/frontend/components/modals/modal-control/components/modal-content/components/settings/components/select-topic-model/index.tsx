import { useState } from "react";

import { ModelTopic, ModelTopicLabels } from "@/constants";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { setTopicModel } from "@/lib/features/botConfig/botConfigSlice";

export const SelectTopicModel = () => {
  const modelTopic = useAppSelector((state) => state.botConfig.topicModel);
  const dispatch = useAppDispatch();
  const [countTopics, setCountTopics] = useState(
    modelTopic.numberTopics.count || 5,
  );

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedModel = e.target.value;

    dispatch(
      setTopicModel({
        name: selectedModel,
        numberTopics: {
          count: countTopics,
          isActive: selectedModel === "LDA",
        },
      }),
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const topicCount = Number(e.target.value);

    setCountTopics(topicCount);

    dispatch(
      setTopicModel({
        name: modelTopic.name,
        numberTopics: {
          count: topicCount,
          isActive: modelTopic.name === "LDA",
        },
      }),
    );
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <span className="text-sm">Topic Model</span>
        <select
          className="p-2 rounded-lg dark:bg-gray-700 text-sm w-[140px]"
          value={modelTopic.name}
          onChange={handleSelectChange}
        >
          {Object.entries(ModelTopic).map(([key, value]) => (
            <option key={key} value={value}>
              {ModelTopicLabels[key as keyof typeof ModelTopic]}
            </option>
          ))}
        </select>
      </div>

      {modelTopic.name === "LDA" && (
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm">Number of topics</span>
          <input
            className="p-2 dark:bg-gray-700 text-sm w-[50px] border-2 border-gray-300 rounded-lg focus:outline-none"
            min={5}
            type="number"
            value={countTopics}
            onChange={handleInputChange}
          />
        </div>
      )}
    </>
  );
};
