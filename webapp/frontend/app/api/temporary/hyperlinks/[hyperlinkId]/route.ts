import { NextResponse } from "next/server";

import { FastCsvService } from "@/app/services/fast-csv.service";

export async function DELETE(
  req: Request,
  { params: { hyperlinkId } }: { params: { hyperlinkId: string } },
): Promise<NextResponse> {
  if (!hyperlinkId) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const csvService = new FastCsvService();
  const directory = "storage/temporary";

  try {
    const isSoftDeleted = await csvService.removeLineInCsv(
      "temp_hyperlinks",
      hyperlinkId,
      directory,
    );

    if (isSoftDeleted) {
      return NextResponse.json({ message: "success" });
    } else {
      return new NextResponse("Not found", { status: 404 });
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    console.error("Error during DELETE operation:", errorMessage);

    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
