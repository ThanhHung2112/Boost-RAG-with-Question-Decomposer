import { NextResponse } from "next/server";

import { appendCsv, readCsv } from "@/lib/fast-csv";
import { createCsvHeader } from "@/lib/fast-csv/create-csv-header";
import { fileExists } from "@/lib/fast-csv/exist-csv";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const { id, originalName, pathName, type, size, createdTime } =
      await req.json();

    if (!id || !originalName || !pathName || !type || !size || !createdTime) {
      return new NextResponse("Bad request", { status: 400 });
    }

    const rows = [
      {
        id,
        originalName,
        pathName,
        type,
        size,
        createdTime,
      },
    ];

    const directory = "storage/temporary";

    if (!fileExists("temp_docs", directory)) {
      await createCsvHeader(
        ["id", "originalName", "pathName", "type", "size", "createdTime"],
        "temp_docs",
        "storage/temporary",
      );
    }

    await appendCsv(rows, "temp_docs", directory);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error processing request:", error);

    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET() {
  const temporaryDocsDirectory = "storage/temporary";

  try {
    const temporaryDocsData = await readCsv(
      "temp_docs",
      temporaryDocsDirectory,
    );

    if (!temporaryDocsData || temporaryDocsData.length === 0) {
      return new NextResponse("Not found", { status: 404 });
    }

    const temporaryDocs = temporaryDocsData.slice(1).map((dataRow) => ({
      id: dataRow?.[0] || null,
      originalName: dataRow?.[1] || null,
      type: dataRow?.[3] || null,
      size: dataRow?.[4] || null,
      createdTime: dataRow?.[5] || null,
    }));

    const filterRecordObjectDocs = temporaryDocs.filter(
      (recordObjectDocs) => recordObjectDocs.id,
    );

    return NextResponse.json(filterRecordObjectDocs);
  } catch (error) {
    console.error("Error fetching temporary docs:", error);

    return new NextResponse("Internal error", { status: 500 });
  }
}
