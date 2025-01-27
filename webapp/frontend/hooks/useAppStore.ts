import type { AppStore } from "@/lib/store";

import { useStore } from "react-redux";

export const useAppStore = useStore.withTypes<AppStore>();
