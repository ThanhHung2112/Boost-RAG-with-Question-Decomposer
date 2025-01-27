import { NextResponse } from "next/server";

import { appendCsv } from "@/lib/fast-csv";

export async function POST(
  req: Request,
  { params: { conversationId } }: { params: { conversationId: string } },
) {
  const { id, link, createdTime, title } = await req.json();

  if (!id || !conversationId || !link || !createdTime || !title) {
    return new NextResponse("Bad request", { status: 400 });
  }

  try {
    const rows = [
      {
        id: id,
        conversationId: conversationId,
        title: title,
        link: link,
        createdTime: createdTime,
      },
    ];

    const directory = "storage/history_hyperlinks";

    appendCsv(rows, conversationId, directory);

    return NextResponse.json({
      id,
      link,
      title,
    });
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 });
  }
}
