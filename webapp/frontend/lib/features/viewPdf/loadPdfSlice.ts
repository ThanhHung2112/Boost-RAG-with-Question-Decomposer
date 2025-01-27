import { createSlice } from "@reduxjs/toolkit";

export const initialState = {
  isLoadingViewPdf: true,
};

const loadViewPdf = createSlice({
  name: "loadViewPdf",
  initialState,
  reducers: {
    setLoading(state, action) {
      state.isLoadingViewPdf = action.payload.isLoadingViewPdf;
    },
  },
});

export const { setLoading } = loadViewPdf.actions;
export const loadViewPdfReducer = loadViewPdf.reducer;
