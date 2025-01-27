import { createSlice } from "@reduxjs/toolkit";

export const initialState = {
  isActiveViewPdf: false,
};

const viewPdf = createSlice({
  name: "viewPdf",
  initialState,
  reducers: {
    turnOff(state, action) {
      state.isActiveViewPdf = action.payload.isActiveViewPdf;
    },
    turnOn(state, action) {
      state.isActiveViewPdf = action.payload.isActiveViewPdf;
    },
  },
});

export const { turnOff, turnOn } = viewPdf.actions;
export const viewPdfReducer = viewPdf.reducer;
