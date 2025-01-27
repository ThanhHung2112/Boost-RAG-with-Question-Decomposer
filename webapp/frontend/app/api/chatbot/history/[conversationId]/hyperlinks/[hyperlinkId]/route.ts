import { NextResponse } from "next/server";

import { FastCsvService } from "@/app/services/fast-csv.service";

export async function DELETE(
  request: Request,
  {
    params: { conversationId, hyperlinkId },
  }: { params: { conversationId: string; hyperlinkId: string } },
): Promise<NextResponse> {
  const csvService = new FastCsvService();

  try {
    const directory = "storage/history_hyperlinks";

    const isSoftDeleted = await csvService.removeLineInCsv(
      conversationId,
      hyperlinkId,
      directory,
    );

    if (isSoftDeleted) {
      return NextResponse.json({ message: "success" });
    }

    return new NextResponse("Not found", { status: 404 });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
