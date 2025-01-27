import fs from "node:fs/promises";
import path from "path";

import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { fileName: string } },
) {
  const { fileName } = params;

  if (!fileName || typeof fileName !== "string") {
    return new NextResponse("Invalid file name", { status: 400 });
  }

  try {
    const body = await req.json();

    const requiredFields = [
      "chatID",
      "docID",
      "url",
      "base64_file",
      "is_base64",
    ];

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return new NextResponse(`Missing or invalid ${field}`, { status: 400 });
      }
    }

    const { chatID, docID, url, base64_file, is_base64 } = body;

    const FILE_DIRECTORY = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(FILE_DIRECTORY, `${fileName}.pdf`);

    try {
      await fs.access(filePath);
    } catch (accessError) {
      return new NextResponse("File not found", { status: 404 });
    }

    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    const stats = await fs.stat(filePath);

    if (stats.size > MAX_FILE_SIZE) {
      return new NextResponse("File too large", { status: 413 });
    }

    const fileBuffer = await fs.readFile(filePath);

    const formData = new FormData();

    formData.append("file", new Blob([fileBuffer]), fileName);
    formData.append("chatID", chatID);
    formData.append("docID", docID);
    formData.append("url", url);
    formData.append("base64_file", base64_file);
    formData.append("is_base64", is_base64.toString());

    return NextResponse.json(
      {
        message: "File processed and sent successfully",
        data: fileBuffer,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error handling request:", error);
    if (error instanceof SyntaxError) {
      return new NextResponse("Invalid JSON in request body", { status: 400 });
    }

    return new NextResponse("Internal server error", { status: 500 });
  }
}
