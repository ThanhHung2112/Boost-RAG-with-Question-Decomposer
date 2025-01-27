import { NextResponse } from "next/server";

import { FileStoreService } from "@/app/services/file-store.service";
import { readCsv } from "@/lib/fast-csv";
import { fileExists } from "@/lib/fast-csv/exist-csv";

export async function GET(
  req: Request,
  { params: { conversationId } }: { params: { conversationId: string } },
) {
  try {
    const directory = "storage/history_hyperlinks";

    if (!fileExists(conversationId, directory)) {
      return NextResponse.json([]);
    }

    const recordFiles = await readCsv(conversationId, directory);

    if (!recordFiles || recordFiles.length === 0) {
      return new NextResponse("Not found", { status: 404 });
    }

    const recordObjectHyperlinks = recordFiles.slice(1).map((data) => ({
      id: data?.[0],
      conversationId: data?.[1],
      title: data?.[2],
      link: data?.[3],
      createdTime: data?.[4],
    }));

    const filterRecordObjectHyperlinks = recordObjectHyperlinks.filter(
      (recordObjectHyperlink) => recordObjectHyperlink.id,
    );

    return NextResponse.json(filterRecordObjectHyperlinks);
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params: { conversationId } }: { params: { conversationId: string } },
) {
  const fileStoreService = new FileStoreService();
  const filesDirectory = "storage/history_hyperlinks";

  try {
    const isDeleted = await fileStoreService.removeFile(
      `${conversationId}.csv`,
      filesDirectory,
    );

    if (isDeleted) {
      return new NextResponse("Success", { status: 200 });
    } else {
      return new NextResponse("Error to delete", { status: 404 });
    }
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 });
  }
}
