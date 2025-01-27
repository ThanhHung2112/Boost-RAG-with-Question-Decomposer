import { NextRequest, NextResponse } from "next/server";

import { FastCsvService } from "@/app/services/fast-csv.service";
import { FileStoreService } from "@/app/services/file-store.service";

export async function DELETE(
  request: NextRequest,
  { params: { docId } }: { params: { docId: string } },
): Promise<NextResponse> {
  if (!docId) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const type = request.nextUrl.searchParams.get("type");
  const csvService = new FastCsvService();
  const fileStore = new FileStoreService();
  const directory = "storage/temporary";

  try {
    let isDeleted = false;
    let isSoftDeleted = false;

    if (!type) {
      isSoftDeleted = await csvService.removeLineInCsv(
        "temp_docs",
        docId,
        directory,
      );
      isDeleted = await fileStore.removeFile(`${docId}.pdf`, "public/uploads");
    } else if (type === "SoftDeleted") {
      isSoftDeleted = await csvService.removeLineInCsv(
        "temp_docs",
        docId,
        directory,
      );
    } else if (type === "Deleted") {
      isDeleted = await fileStore.removeFile(`${docId}.pdf`, "public/uploads");
    }

    if (
      (type === "SoftDeleted" && isSoftDeleted) ||
      (type === "Deleted" && isDeleted) ||
      (isDeleted && isSoftDeleted)
    ) {
      return NextResponse.json({ message: "success" });
    }

    return new NextResponse("Not found", { status: 404 });
  } catch (error) {
    console.error("Error during DELETE operation:", error);

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
