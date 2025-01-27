import { NextResponse } from "next/server";

import { FastCsvService } from "@/app/services";
import { readCsv } from "@/lib/fast-csv";

export async function PUT(
  req: Request,
  {
    params: { conversationId },
  }: { params: { conversationId: string | undefined } },
): Promise<NextResponse> {
  if (!conversationId) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const fastCsvService = new FastCsvService();

  try {
    const { data } = await req.json();

    await fastCsvService.updateRowInCsv(conversationId, data);

    return NextResponse.json({});
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params: { conversationId } }: { params: { conversationId: string } },
) {
  if (!conversationId) {
    return new NextResponse("Bad request", { status: 400 });
  }

  try {
    const directory = "storage/conversations";
    const conversationData = await readCsv("db_conversations", directory);

    if (!conversationData || conversationData.length === 0) {
      return new NextResponse("Not found", { status: 404 });
    }

    const filteredMessages = conversationData.filter(
      (message) => message[0] === conversationId,
    );

    return NextResponse.json({
      id: filteredMessages[0][1],
      conversationName: filteredMessages[0][1],
      createdTime: filteredMessages[0][2],
    });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
