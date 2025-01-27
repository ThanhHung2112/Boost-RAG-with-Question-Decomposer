import Redis from "ioredis";
import { Worker, Queue, Job } from "bullmq";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

import { formatDateTime } from "@/lib";

const redisPort = Number(process.env.NEXT_PUBLIC_REDIS_PORT);
const redisUrl = process.env.NEXT_PUBLIC_REDIS_URL;
const appKey = process.env.NEXT_PUBLIC_APP_KEY;

const urlApiApp = process.env.NEXT_PUBLIC_API_APP_URL;
const urlApiChatbot = process.env.NEXT_PUBLIC_API_SERVICE_CHATBOT;

if (!appKey) {
  throw new Error("APP_KEY is not defined");
}

if (isNaN(redisPort) || redisPort < 0 || redisPort >= 65536) {
  throw new Error(`Invalid Redis port: ${process.env.NEXT_PUBLIC_REDIS_PORT}`);
}

if (!redisUrl) {
  throw new Error("REDIS_URL is not defined");
}

if (!urlApiApp) {
  throw new Error("API APP is not defined");
}

if (!urlApiChatbot) {
  throw new Error("API SERVICE CHATBOT is not defined");
}

const connection = new Redis({
  host: redisUrl,
  port: redisPort,
  maxRetriesPerRequest: null,
});

export const testQueue = new Queue(appKey, {
  connection: connection,
});

const worker = new Worker(
  appKey,
  async (job: Job) => {
    // Tracking 1:
    console.log("[CHECK_POINT_01]: ", job.data);

    try {
      const { chatID, message, llm, language } = job.data;

      console.log(
        `Processing job ${job.id} with data: chatID=${chatID}, message=${message}, llm=${llm}, language=${language}`,
      );

      const response = await fetch(
        `http://127.0.0.1:8000/jobs/get_response?chatID=${chatID}&message=${message}&llm=${llm}&language=${language}`,
      );
      const data = await response.json();

      const payload = {
        id: uuidv4(),
        conversationId: chatID,
        clientId: "clienttest",
        context: data.response,
        sender: "bot",
        createdTime: formatDateTime(new Date()),
      };

      try {
        await axios.post(
          `http://localhost:3000/api/chatbot/history/${chatID}`,
          payload,
        );
      } catch (error) {
        console.error("Server error sent data:", error);
      }

      console.log("Received data from API:", data);

      return data;
    } catch (error) {
      console.error("Error processing job:", error);
      throw new Error(`Job processing failed: ${error}`);
    }
  },
  {
    connection: connection,
    concurrency: 5,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
);

export const addJobToQueue = async (
  chatID: string,
  message: string,
  llm: string,
  language: string,
  callbackURL: string,
) => {
  try {
    const jobData = { chatID, message, llm, language, callbackURL };
    const queueJob = await testQueue.add("someJob", jobData);

    return { status: "Job added successfully", jobId: queueJob.id };
  } catch (error) {
    console.error("Error adding job to queue:", error);

    return { status: "Failed to add job", error: error };
  }
};

export default worker;
