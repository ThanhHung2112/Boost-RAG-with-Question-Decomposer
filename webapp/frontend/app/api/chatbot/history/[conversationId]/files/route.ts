import { NextResponse } from "next/server";

import { FileStoreService } from "@/app/services/file-store.service";
import { appendCsv } from "@/lib/fast-csv";

export async function GET(
  request: Request,
  { params: { conversationId } }: { params: { conversationId: string } },
) {
  const fileStoreService = new FileStoreService();

  try {
    const conversationHistory = await fileStoreService.findById(
      "123",
      conversationId,
    );

    return NextResponse.json(conversationHistory);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params: { conversationId } }: { params: { conversationId: string } },
) {
  const { id, fileName, type, size, createdTime } = await req.json();

  if (!id || !conversationId || !type || !size || !fileName || !createdTime) {
    return new NextResponse("Bad request", { status: 400 });
  }

  try {
    const rows = [
      {
        id: id,
        conversationId: conversationId,
        fileName: fileName,
        createdTime: createdTime,
      },
    ];

    const directory = "stroge/history_files";

    appendCsv(rows, conversationId, directory);

    return NextResponse.json({
      id,
      fileName,
    });
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 });
  }
}
