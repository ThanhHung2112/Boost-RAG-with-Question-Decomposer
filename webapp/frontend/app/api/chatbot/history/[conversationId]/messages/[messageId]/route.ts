import { NextResponse } from "next/server";

import { FastCsvService } from "@/app/services/fast-csv.service";

export async function PUT(
  req: Request,
  {
    params: { conversationId, messageId },
  }: { params: { conversationId: string; messageId: string } },
) {
  if (!conversationId) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const { data } = await req.json();

  if (!data) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const csvService = new FastCsvService();

  try {
    await csvService.updateRowInCsv(conversationId, data);

    return new NextResponse("Update Success", { status: 200 });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
