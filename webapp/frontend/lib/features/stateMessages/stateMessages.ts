import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type StateMessage = {
  conversationId: string;
  chatId: string;
};

export const initialState = {
  stateMessages: [] as StateMessage[],
};

const stateMessages = createSlice({
  name: "StateMessageBot",
  initialState,
  reducers: {
    addStateMessage(state, action: PayloadAction<StateMessage>) {
      state.stateMessages.push(action.payload);
    },
    removeStateMessage(state, action) {
      state.stateMessages = state.stateMessages.filter(
        (message) => message.conversationId !== action.payload,
      );
    },
  },
});

export const { addStateMessage, removeStateMessage } = stateMessages.actions;
export const stateMessagesReducer = stateMessages.reducer;
