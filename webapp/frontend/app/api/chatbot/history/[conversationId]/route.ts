import { NextResponse } from "next/server";

import { appendCsv, readCsv } from "@/lib/fast-csv";
import { FileStoreService } from "@/app/services/file-store.service";
import { FastCsvService } from "@/app/services/fast-csv.service";

export async function POST(
  req: Request,
  { params: { conversationId } }: { params: { conversationId: string } },
) {
  const { id, clientId, context, sender, createdTime } = await req.json();

  if (!id || !context || !sender || !createdTime) {
    return new NextResponse("Bad request", { status: 400 });
  }

  try {
    const rows = [
      {
        id: id,
        conversationId: conversationId,
        clientId: clientId,
        context: context,
        sender: sender,
        createdTime: createdTime,
      },
    ];

    const _dirname = "storage/chat_history";

    appendCsv(rows, conversationId, _dirname);

    return new NextResponse("Success", { status: 200 });
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
    const directory = "storage/chat_history";
    const conversationData = await readCsv(conversationId, directory);

    if (!conversationData || conversationData.length === 0) {
      return new NextResponse("Not found", { status: 404 });
    }

    const chatHistory = conversationData.slice(1).map((data) => ({
      id: data?.[0],
      conversationId: data?.[1],
      clientId: data?.[2],
      context: data?.[3],
      sender: data?.[4],
      createdTime: data?.[5],
    }));

    return NextResponse.json(chatHistory);
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  {
    params: { conversationId },
  }: { params: { conversationId: string | undefined } },
) {
  if (!conversationId) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const fileStoreService = new FileStoreService();
  const csvService = new FastCsvService();
  const directory = "storage/chat_history";

  try {
    const isDeleted = await fileStoreService.removeFile(
      `${conversationId}.csv`,
      directory,
    );
    const isSoftDeleted = await csvService.removeLineInCsv(
      "db_conversations",
      conversationId,
      "storage/conversations",
    );

    if (isDeleted && isSoftDeleted) {
      return new NextResponse("Success", { status: 200 });
    } else {
      return new NextResponse("Not found", { status: 404 });
    }
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
