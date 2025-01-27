import { NextResponse } from "next/server";

import { readCsv } from "@/lib/fast-csv";
import { fileExists } from "@/lib/fast-csv/exist-csv";

export async function GET(req: Request) {
  try {
    const directory = "storage/conversations";

    if (!fileExists("db_conversations", directory)) {
      return NextResponse.json([]);
    }

    const recordConversations = await readCsv("db_conversations", directory);

    if (!recordConversations || recordConversations.length === 0) {
      return new NextResponse("Not found", { status: 404 });
    }

    const recordObjectConversations = recordConversations
      .slice(1)
      .map((data) => ({
        id: data?.[0],
        conversationName: data?.[1],
        createdTime: data?.[2],
      }));

    const filterRecordObjectConversations = recordObjectConversations.filter(
      (recordObjectConversations) => recordObjectConversations.id,
    );

    return NextResponse.json({
      conversations: filterRecordObjectConversations,
    });
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 });
  }
}
