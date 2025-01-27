import { NextResponse } from "next/server";

import { ConversationService } from "@/app/services/conversation.service";

export function GET() {
  return NextResponse.json("Hello, Next.js!");
}

export async function POST(req: Request): Promise<NextResponse> {
  const { conversationName, createdTime } = await req.json();

  // if (!id || !conversationName || !createdTime) {
  //   return new NextResponse("Bad request", { status: 400 });
  // }

  const conversationService = new ConversationService();

  try {
    const isCreated = await conversationService.createDataStore();

    return NextResponse.json({ id: isCreated });
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 });
  }
}
