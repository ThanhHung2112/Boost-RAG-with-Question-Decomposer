import {
  SelectDisplayLanguage,
  SelectModelLanguage,
  SelectModels,
  SelectThemes,
  SelectTopicModel,
  SwitchDevMode,
} from "./components";

export const Settings = () => {
  return (
    <>
      <SelectThemes />
      <SwitchDevMode />
      <SelectModels />
      <SelectTopicModel />
      <SelectModelLanguage />
      <SelectDisplayLanguage />
    </>
  );
};
