import { createSlice } from "@reduxjs/toolkit";

import { ModelLanguage, ModelTopic, ModelType } from "@/constants";

interface BotConfigState {
  model: ModelType;
  topicModel: {
    name: string;
    numberTopics: {
      count: number;
      isActive: boolean;
    };
  };
  modelLanguage: ModelLanguage;
};

const getStoredState = () => {
  if (typeof window === "undefined") {
    return {
      model: ModelType.GEMAMA2_2B,
      topicModel: {
        name: ModelTopic.FASTOPIC,
        numberTopics: {
          count: 5,
          isActive: false,
        },
      },
      modelLanguage: ModelLanguage.EN,
    };
  }

  const storedState = sessionStorage.getItem("botConfig");
  return storedState ? JSON.parse(storedState) : {
    model: ModelType.GEMAMA2_2B,
    topicModel: {
      name: ModelTopic.FASTOPIC,
      numberTopics: {
        count: 5,
        isActive: false,
      },
    },
    modelLanguage: ModelLanguage.EN,
  };
};

console.log("Get state: ", getStoredState());

export const initialState: BotConfigState = getStoredState();

const botConfig = createSlice({
  name: "botConfig",
  initialState,
  reducers: {
    setModel: (state, action) => {
      state.model = action.payload;

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "botConfig",
          JSON.stringify(state),
        );
      }
    },
    setTopicModel: (state, action) => {
      state.topicModel = action.payload;

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "botConfig",
          JSON.stringify(state),
        );
      }
    },
    setModelLanguage: (state, action) => {
      state.modelLanguage = action.payload;

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "botConfig",
          JSON.stringify(state),
        );
      }
    },
  },
});

export const { setModel, setTopicModel, setModelLanguage } = botConfig.actions;
export const botConfigReducer = botConfig.reducer;
