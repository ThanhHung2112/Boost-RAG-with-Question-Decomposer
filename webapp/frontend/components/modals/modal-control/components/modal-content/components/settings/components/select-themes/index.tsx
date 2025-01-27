import { MoonIcon, SunIcon } from "@/components/icons";
import { Theme, ThemeLabels } from "@/constants";
import { Switch } from "@nextui-org/switch";

export const SelectThemes = () => {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm">Theme</span>
      <Switch
        defaultSelected
        color="default"
        endContent={<MoonIcon />}
        size="sm"
        startContent={<SunIcon />}
      >
      </Switch>
    </div>
  );
};
