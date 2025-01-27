import { NextResponse } from "next/server";

import { DocService, HyperlinkService, MessageService } from "@/app/services";

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

  const messageService = new MessageService();
  const hyperlinkService = new HyperlinkService();
  const docService = new DocService();

  try {
    const isCreatedMessage = await messageService.createDataStore({
      isActive: true,
      name: conversationId,
    });

    const isCreatedHyperlink = await hyperlinkService.createDataStore({
      isActive: true,
      name: conversationId,
    });

    const isCreatedDoc = await docService.createDataStore({
      isActive: true,
      name: conversationId,
    });

    if (isCreatedMessage && isCreatedHyperlink && isCreatedDoc) {
      return NextResponse.json({ status: true });
    }

    return NextResponse.json({ status: false });
  } catch (error) {
    console.error("post", error);

    return NextResponse.json({ status: false }, { status: 500 });
  }
}
