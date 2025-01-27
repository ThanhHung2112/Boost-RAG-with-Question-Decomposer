import { NextResponse } from "next/server";

import { readCsv } from "@/lib/fast-csv";
import { fileExists } from "@/lib/fast-csv/exist-csv";

export async function GET(
  req: Request,
  { params: { conversationId } }: { params: { conversationId: string } },
) {
  try {
    const directory = "storage/chat_history";

    if (!fileExists(conversationId, directory)) {
      return NextResponse.json([]);
    }

    const recordFiles = await readCsv(conversationId, directory);

    if (!recordFiles || recordFiles.length === 0) {
      return new NextResponse("Not found", { status: 404 });
    }

    const recordObjectFiles = recordFiles.slice(1).map((data) => ({
      id: data?.[0],
      conversationId: data?.[1],
      clientId: data?.[2],
      context: data?.[3],
      pathName: data?.[6],
    }));

    const filterRecordObjectFiles = recordObjectFiles.filter(
      (recordObjectFile) => recordObjectFile.id,
    );

    return NextResponse.json(filterRecordObjectFiles);
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 });
  }
}
