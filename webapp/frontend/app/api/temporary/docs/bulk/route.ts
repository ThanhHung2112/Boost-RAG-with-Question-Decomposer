import { NextResponse } from "next/server";

import { appendCsv } from "@/lib/fast-csv";
import { fileExists } from "@/lib/fast-csv/exist-csv";
import { createCsvHeader } from "@/lib/fast-csv/create-csv-header";

export async function POST(req: Request) {
  const { data } = await req.json();

  if (data.items.length === 0) {
    return new NextResponse("Bad request", { status: 400 });
  }

  console.log(data);

  try {
    let rows: any[] = [];
    let fileIdList: string[] = [];
    const directory = "storage/temporary";

    for (const item of data.items) {
      const row = {
        id: item.id,
        originalName: item.originalName,
        pathName: `/uploads/${item.id}`,
        type: item.type,
        size: item.size,
        createdTime: item.createdTime,
      };

      if (!fileExists("temp_docs", directory)) {
        await createCsvHeader(
          ["id", "originalName", "pathName", "type", "size", "createdTime"],
          "temp_docs",
          "storage/temporary",
        );
      } else {
        rows.push(row);
      }

      fileIdList.push(item.id);
    }

    if (rows.length > 0) {
      await appendCsv(rows, "temp_docs", directory);
    }

    return NextResponse.json({ items: fileIdList });
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 });
  }
}
