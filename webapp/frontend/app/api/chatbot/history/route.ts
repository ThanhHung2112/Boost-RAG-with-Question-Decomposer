import { NextRequest, NextResponse } from "next/server";

import { appendCsv } from "@/lib/fast-csv";
import { createCsvHeader } from "@/lib/fast-csv/create-csv-header";
import { fileExists } from "@/lib/fast-csv/exist-csv";
import { createCsv } from "@/lib/fast-csv/write-csv";
import { getFilesInDirectory } from "@/lib/getFilesInDirectory";

export async function POST(req: Request): Promise<NextResponse> {
  const { id, conversationId, clientId, context, sender, createdTime } =
    await req.json();

  if (
    !id ||
    !conversationId ||
    !clientId ||
    !context ||
    !sender ||
    !createdTime
  ) {
    return new NextResponse("Bad request", { status: 400 });
  }

  try {
    const directory = "storage/chat_history";

    await createCsv(
      {
        id: id,
        conversationId: conversationId,
        clientId: clientId,
        context: context,
        sender: sender,
        createdTime: createdTime,
      },
      conversationId,
      directory,
    );

    if (fileExists(conversationId, directory)) {
      await createCsv(
        {
          id: conversationId,
          conversationName: "New conversation",
          createdTime: createdTime,
        },
        "db_conversations",
        "storage/conversations",
      );
    }

    const rows = [
      {
        id: conversationId,
        conversationName: "New conversation",
        createdTime: createdTime,
      },
    ];

    appendCsv(rows, "db_conversations", "storage/conversations");

    // Service to create csv header for docs
    // await createCsvHeader(
    //   [
    //     "id",
    //     "conversationId",
    //     "fileName",
    //     "size",
    //     "type",
    //     "createdTime",
    //     "pathName",
    //   ],
    //   `${conversationId}`,
    //   "storage/history_files",
    // );

    await createCsvHeader(
      ["id", "conversationId", "title", "link", "createdTime"],
      `${conversationId}`,
      "storage/history_hyperlinks",
    );

    return NextResponse.json({ conversationId });
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = searchParams.get("limit");
    const sort = searchParams.get("sort");

    const files = await getFilesInDirectory("chat_history");

    const conversations = files
      ?.map((file) => {
        return {
          conversationId: file.split(".")[0],
        };
      })
      .splice(0, limit ? parseInt(limit) : Infinity);

    return NextResponse.json({ conversations });
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
