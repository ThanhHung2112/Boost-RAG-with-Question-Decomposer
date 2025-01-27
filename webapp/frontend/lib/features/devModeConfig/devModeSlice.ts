import { createSlice } from "@reduxjs/toolkit";
import { get } from "lodash";

interface DevModeState {
  isActiveDevMode: boolean;
}

const getStoredState = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  const storedState = sessionStorage.getItem("isActiveDevMode");
  return storedState === "true";
};


console.log("Get state: ", getStoredState());

export const initialState: DevModeState = {
  isActiveDevMode: getStoredState(),
};

const devMode = createSlice({
  name: "devMode",
  initialState,
  reducers: {
    toggleDevMode: (state) => {
      state.isActiveDevMode = !state.isActiveDevMode;

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "isActiveDevMode",
          JSON.stringify(state.isActiveDevMode),
        );
      }
    },
  },
});

export const { toggleDevMode } = devMode.actions;
export const devModeReducer = devMode.reducer;
