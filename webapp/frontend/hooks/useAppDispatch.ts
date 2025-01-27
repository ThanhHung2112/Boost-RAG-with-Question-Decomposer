import type { AppDispatch } from "@/lib/store";

import { useDispatch } from "react-redux";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
