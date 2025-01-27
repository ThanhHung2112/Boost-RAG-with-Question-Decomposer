import { NextResponse } from "next/server";

import { FastCsvService } from "@/app/services/fast-csv.service";
import { FileStoreService } from "@/app/services/file-store.service";

export async function DELETE(
  request: Request,
  {
    params: { conversationId, fileId },
  }: { params: { conversationId: string; fileId: string } },
): Promise<NextResponse> {
  const csvService = new FastCsvService();
  const fileStore = new FileStoreService();

  try {
    const directory = "storage/history_files";

    const isSoftDeleted = await csvService.removeLineInCsv(
      conversationId,
      fileId,
      directory,
    );
    const isDeleted = await fileStore.removeFile(
      `${fileId}.pdf`,
      "public/uploads",
    );

    if (isDeleted && isSoftDeleted) {
      return NextResponse.json({ message: "success" });
    }

    return new NextResponse("Not found", { status: 404 });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
