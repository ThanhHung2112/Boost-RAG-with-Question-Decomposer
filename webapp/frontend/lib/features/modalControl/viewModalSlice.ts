import { createSlice } from "@reduxjs/toolkit";

export const initialState = {
  isActiveViewModal: false,
};

const viewModal = createSlice({
  name: "viewModal",
  initialState,
  reducers: {
    turnOff(state, action) {
      state.isActiveViewModal = action.payload.isActiveViewModal;
    },
    turnOn(state, action) {
      state.isActiveViewModal = action.payload.isActiveViewModal;
    },
  },
});

export const { turnOff, turnOn } = viewModal.actions;
export const viewModalReducer = viewModal.reducer;
