import { NextResponse } from "next/server";

import { FileStoreService } from "@/app/services/file-store.service";
import { appendCsv, readCsv } from "@/lib/fast-csv";
import { fileExists } from "@/lib/fast-csv/exist-csv";
import { createCsvHeader } from "@/lib/fast-csv/create-csv-header";

export async function POST(
  req: Request,
  { params: { conversationId } }: { params: { conversationId: string } },
) {
  const { data } = await req.json();

  if (data.length === 0) {
    return new NextResponse("Bad request", { status: 400 });
  }

  try {
    let rows: any[] = [];
    let fileIdList: string[] = [];
    const directory = "storage/history_files";

    for (const item of data) {
      const row = {
        id: item.id,
        conversationId: conversationId,
        originalName: item.originalName,
        pathName: `/uploads/${item.id}`,
        type: item.type,
        size: item.size,
        createdTime: item.createdTime,
      };

      console.log("item: ", item);

      if (!fileExists(conversationId, directory)) {
        await createCsvHeader(
          ["id", "originalName", "pathName", "type", "size", "createdTime"],
          conversationId,
          directory,
        );
      }

      rows.push(row);

      fileIdList.push(item.id);
    }

    console.log("after: ", rows);

    if (rows.length > 0) {
      await appendCsv(rows, conversationId, directory);
    }

    return NextResponse.json({ items: fileIdList });
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params: { conversationId } }: { params: { conversationId: string } },
) {
  try {
    const directory = "storage/history_files";

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
      originalName: data?.[2],
      pathName: data?.[3],
      type: data?.[4],
      size: data?.[5],
      createdTime: data?.[6],
    }));

    const filterRecordObjectFiles = recordObjectFiles.filter(
      (recordObjectFile) => recordObjectFile.id,
    );

    return NextResponse.json(filterRecordObjectFiles);
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params: { conversationId } }: { params: { conversationId: string } },
) {
  const fileStoreService = new FileStoreService();
  const filesDirectory = "storage/history_files";

  try {
    const files = await readCsv(conversationId, filesDirectory);
    const fileObjects = files.slice(1).map((file) => ({
      id: file[0],
      conversationId: file[1],
      originalName: file[2],
      pathName: `${file[0]}.pdf`,
      type: file[4],
      size: file[5],
      createdTime: file[6],
    }));

    const filterRecordObjectFiles = fileObjects.filter(
      (recordObjectFile) => recordObjectFile.id,
    );

    const isDeleted = await fileStoreService.removeMutipleFile(
      filterRecordObjectFiles,
      "public/uploads",
    );

    if (isDeleted) {
      await fileStoreService.removeFile(
        `${conversationId}.csv`,
        filesDirectory,
      );

      return new NextResponse("Success", { status: 200 });
    } else {
      return new NextResponse("Error to delete", { status: 404 });
    }
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 });
  }
}
