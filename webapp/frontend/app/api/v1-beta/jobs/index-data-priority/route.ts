import fs from "node:fs/promises";
import path from "path";

import { NextRequest, NextResponse } from "next/server";

import { addJobIndexDataToQueue } from "@/app/workers/index-data.worker";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const extractFormField = (
      name: string,
      defaultValue: string = "",
    ): string => {
      const value = formData.get(name);

      return value ? String(value) : defaultValue;
    };

    const chatID = extractFormField("chatID");
    const docID = extractFormField("docID");
    const url = extractFormField("url");
    const base64File = extractFormField("base64_file");
    const is_base64 = extractFormField("is_base64", "false");
    const number_of_topics = extractFormField("number_of_topics", "0");

    const file = formData.get("file") as File | null;

    let filePath: string | null = null;

    if (file) {
      const uploadDir = path.join(process.cwd(), "public/tmp");

      await fs.mkdir(uploadDir, { recursive: true });

      const uniqueFileName = `${docID}.pdf`;

      filePath = path.join(uploadDir, uniqueFileName);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        await fs.writeFile(filePath, uint8Array);

        console.log(`File saved successfully: ${filePath}`);
      } catch (writeError) {
        console.error("Error writing file:", writeError);

        return NextResponse.json(
          {
            error: "Failed to save file",
            details:
              writeError instanceof Error
                ? writeError.message
                : "Unknown error",
          },
          { status: 500 },
        );
      }
    }

    const topicModel = req.nextUrl.searchParams.get("topic_model") || "";
    const language = req.nextUrl.searchParams.get("language") || "en";

    console.log("Job Submission Details:", {
      chatID,
      docID,
      url,
      topicModel,
      language,
      filePath,
      base64FileProvided: !!base64File,
      is_base64,
      number_of_topics,
    });

    const validationErrors: string[] = [];

    if (!chatID) validationErrors.push("chatID is required");
    if (!docID) validationErrors.push("docID is required");

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Validation Failed",
          details: validationErrors,
        },
        { status: 400 },
      );
    }

    const jobResult = await addJobIndexDataToQueue(
      chatID,
      docID,
      url || null,
      file,
      base64File || null,
      topicModel,
      language,
      is_base64 === "false",
      parseInt(number_of_topics, 10),
    );

    return NextResponse.json(
      {
        message: "Index data priority added to the queue",
        status: jobResult.status,
        jobID: jobResult.jobID,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in index data queue submission:", error);

    const errorResponse = {
      message: "Failed to process index data request",
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
            }
          : "Unknown server error",
    };

    return NextResponse.json(errorResponse, {
      status:
        error instanceof Error && "status" in error
          ? (error as any).status || 500
          : 500,
    });
  }
}
