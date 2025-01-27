import { NextRequest, NextResponse } from "next/server";

import { addJobToQueue } from "@/app/workers/test.worker";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const callbackURL = searchParams.get("callbackURL");
    const conversationId = searchParams.get("conversationId");
    const llm = searchParams.get("llm");
    const language = searchParams.get("language");
    const context = searchParams.get("context");

    console.log(
      `callbackURL: ${callbackURL}, conversationId: ${conversationId}, llm: ${llm}, language: ${language}, context: ${context}`,
    );

    if (!callbackURL) {
      return NextResponse.json(
        { error: "callbackURL is required" },
        { status: 400 },
      );
    }

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 },
      );
    }

    if (!context) {
      return NextResponse.json(
        { error: "context is required" },
        { status: 400 },
      );
    }

    if (!llm) {
      return NextResponse.json({ error: "llm is required" }, { status: 400 });
    }

    if (!language) {
      return NextResponse.json(
        { error: "language is required" },
        { status: 400 },
      );
    }

    const { status, jobId } = await addJobToQueue(
      conversationId,
      context,
      llm,
      language,
      callbackURL,
    );

    return NextResponse.json({
      status: "Message added to the queue",
      jobId: jobId,
    });
  } catch (error) {
    console.error("Error adding job to queue:", error);

    return NextResponse.json(
      {
        status: "Failed to add message to the queue",
        error: error || "Unknown error",
      },
      { status: 500 },
    );
  }
}
