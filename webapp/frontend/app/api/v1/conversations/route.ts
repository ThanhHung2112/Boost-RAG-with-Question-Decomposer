import { NextResponse } from "next/server";

import { ConversationService } from "@/app/services/conversation.service";

export function GET() {
  return NextResponse.json("Hello, Next.js!");
}

export async function POST(req: Request): Promise<NextResponse> {
  const { id, conversationName, createdTime } = await req.json();

  if (!id || !conversationName || !createdTime) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const conversationService = new ConversationService();

  try {
    //Create Conversations Store
    const isCreated = await conversationService.createDataStore();

    await conversationService.insertData(
      { id, conversationName, createdTime },
      {},
    );

    return NextResponse.json({ status: true });
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 });
  }
}
