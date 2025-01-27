import { Switch } from "@nextui-org/switch";

import { useAppDispatch, useAppSelector } from "@/hooks";
import { toggleDevMode } from "@/lib/features/devModeConfig/devModeSlice";

export const SwitchDevMode = () => {
  // const [isSelected, setIsSelected] = useState(false);
  const dispatch = useAppDispatch();
  const isActiveDevMode = useAppSelector(
    (state) => state.devMode.isActiveDevMode,
  );

  const handleSwitchChange = () => {
    // setIsSelected(!isSelected);
    dispatch(toggleDevMode());
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <span className="text-sm">Dev mode</span>
        <Switch
          defaultSelected
          aria-label="Automatic updates"
          color="primary"
          isSelected={isActiveDevMode}
          size="sm"
          onValueChange={handleSwitchChange}
        />
      </div>
      {isActiveDevMode && (
        <span className="text-xs text-gray-500">
          (This mode lets you explore advanced bot features and behaviors.)
        </span>
      )}
    </>
  );
};
