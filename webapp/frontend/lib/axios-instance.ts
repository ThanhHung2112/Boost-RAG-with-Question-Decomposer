import axios from "axios";

export const axiosInstance = (typeService: string): any => {
  if (typeService === "API_APP") {
    return axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
  if (typeService === "API_CHATBOT") {
    return axios.create({
      baseURL: process.env.NEXT_PUBLIC_SERVICE_CHATBOT,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return;
};
