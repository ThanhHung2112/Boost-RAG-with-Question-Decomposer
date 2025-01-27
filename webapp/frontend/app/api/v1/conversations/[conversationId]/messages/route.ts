import { NextResponse } from "next/server";

import { MessageService } from "@/app/services";

export function GET() {
  return NextResponse.json("Hello, Next.js!");
}

export async function POST(
  request: Request,
  {
    params: { conversationId },
  }: { params: { conversationId: string | undefined } },
): Promise<NextResponse> {
  if (!conversationId) {
    return NextResponse.json({ status: false }, { status: 400 });
  }

  const { id, context, sender, createdTime } = await request.json();

  const messageService = new MessageService();

  try {
    const sendMessage = await messageService.sendMessage(
      {
        id,
        conversationId,
        context,
        sender,
        createdTime,
      },
      {
        isActive: true,
        name: conversationId,
      },
    );

    console.log("sendMessage", sendMessage);

    return NextResponse.json({ status: true });
  } catch (error) {
    console.error("post", error);

    return NextResponse.json({ status: false }, { status: 500 });
  }
}
