import * as fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "path";

import Redis from "ioredis";
import { Worker, Queue, Job } from "bullmq";
import axios from "axios";
import FormData from "form-data";
import { NextResponse } from "next/server";

const redisPort = Number(process.env.NEXT_PUBLIC_REDIS_PORT);
const redisUrl = process.env.NEXT_PUBLIC_REDIS_URL;
const appKey = "index-data-queue";
const urlApiChatbot = process.env.NEXT_PUBLIC_API_SERVICE_CHATBOT;

if (!appKey || !redisUrl || !urlApiChatbot || isNaN(redisPort)) {
    throw new Error("Invalid environment variables");
}

const connection = new Redis({
    host: redisUrl,
    port: redisPort,
    maxRetriesPerRequest: null,
});

export const indexDataQueue = new Queue(appKey, { connection });

const worker = new Worker(
    appKey,
    async (job: Job) => {
        try {
            const {
                chatID,
                docID,
                url,
                topicModel,
                language,
                file,
                base64File,
                is_base64,
                number_of_topics,
            } = job.data;

            const formData = new FormData();

            console.log("Log File: ", file);

            formData.append("chatID", chatID || "");
            formData.append("docID", docID || "");
            formData.append("is_base64", is_base64.toString() || "false");
            formData.append("number_of_topics", number_of_topics.toString() || "0");

            if (url) {
                formData.append("url", url);
            }

            if (file !== null) {
                const fileFolder = path.join(process.cwd(), "public/tmp");
                const filePath = path.join(fileFolder, `${docID}.pdf`);

                try {
                    await fs.access(filePath);
                    formData.append("file", createReadStream(filePath), {
                        contentType: "application/pdf",
                        filename: `${docID}.pdf`,
                    });
                    console.log(`File added to FormData: ${filePath}`);
                } catch (err) {
                    console.error(`File not found: ${filePath}`, err);
                    throw new Error(`File with docID ${docID} does not exist`);
                }
            }

            const response = await axios.post(
                `${urlApiChatbot}/index-data-priority`,
                formData,
                {
                    params: {
                        topic_model: topicModel,
                        language: language,
                    },
                    headers: formData.getHeaders(),
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity,
                },
            );

            console.log("Response:", response.data);
            if (response.data.status !== "success")
                return NextResponse.json(
                    { error: "API CALL FAILED: " + response.data.status },
                    { status: 400 },
                );

            return response.data;
        } catch (error) {
            console.error("Error processing job:", error);

            if (axios.isAxiosError(error)) {
                console.error("Axios Error Details:", {
                    status: error.response?.status,
                    data: error.response?.data,
                    headers: error.response?.headers,
                });
            }

            throw error;
        }
    },
    {
        connection,
        concurrency: 5,
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
    },
);

export const addJobIndexDataToQueue = async (
    chatID: string,
    docID: string,
    url: string | null,
    file: File | string | { path: string } | null,
    base64File: string | null,
    topicModel: string,
    language: string,
    is_base64: boolean,
    number_of_topics: number,
) => {
    try {
        const jobData = {
            chatID,
            docID,
            url,
            file,
            base64File,
            topicModel,
            language,
            is_base64,
            number_of_topics,
        };

        const queueJob = await indexDataQueue.add("indexDataJob", jobData, {
            priority: 1,
        });

        return { status: "Job added", jobID: queueJob.id };
    } catch (error) {
        console.error("Error adding job:", error);

        return { status: "Failed to add job", error: error };
    }
};

export default worker;
