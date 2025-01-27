import { NextResponse } from "next/server";

import { appendCsv, readCsv } from "@/lib/fast-csv";
import { createCsvHeader } from "@/lib/fast-csv/create-csv-header";
import { fileExists } from "@/lib/fast-csv/exist-csv";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const { id, title, link, createdTime } = await req.json();

    if (!id || !title || !link || !createdTime) {
      return new NextResponse("Bad request", { status: 400 });
    }

    const hyperlinksData = [
      {
        id,
        title,
        link,
        createdTime,
      },
    ];

    const directory = "storage/temporary";

    if (!fileExists("temp_hyperlinks", directory)) {
      await createCsvHeader(
        ["id", "title", "link", "createdTime"],
        "temp_hyperlinks",
        directory,
      );
    }

    await appendCsv(hyperlinksData, "temp_hyperlinks", directory);

    return NextResponse.json(hyperlinksData);
  } catch (error) {
    console.error("Error processing request:", error);

    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function GET() {
  const directory = "storage/temporary";

  try {
    const hyperlinksData = await readCsv("temp_hyperlinks", directory);

    if (!hyperlinksData || hyperlinksData.length === 0) {
      return new NextResponse("Not found", { status: 404 });
    }

    const hyperlinks = hyperlinksData.slice(1).map((data) => ({
      id: data?.[0],
      title: data?.[1],
      link: data?.[2],
      createdTime: data?.[3],
    }));

    const filterRecordObjectHyperlinks = hyperlinks.filter(
      (recordObjectHyperlinks) => recordObjectHyperlinks.id,
    );

    return NextResponse.json(filterRecordObjectHyperlinks);
  } catch (error) {
    console.error("Error processing GET request:", error);

    return new NextResponse("Internal error", { status: 500 });
  }
}
