import { configureStore } from "@reduxjs/toolkit";

import { viewPdfReducer } from "./features/viewPdf/viewPdfSlice";
import { loadViewPdfReducer } from "./features/viewPdf/loadPdfSlice";
import { viewModalReducer } from "./features/modalControl/viewModalSlice";
import { stateMessagesReducer } from "./features/stateMessages/stateMessages";
import { botConfigReducer } from "./features/botConfig/botConfigSlice";
import { devModeReducer } from "./features/devModeConfig/devModeSlice";

export const store = () => {
  return configureStore({
    reducer: {
      viewPdf: viewPdfReducer,
      loadViewPdf: loadViewPdfReducer,
      viewModal: viewModalReducer,
      stateMessages: stateMessagesReducer,
      botConfig: botConfigReducer,
      devMode: devModeReducer,
    },
  });
};

export type AppStore = ReturnType<typeof store>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
