import fs from "node:fs/promises";
import path from "path";

import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const uploadDir = path.join(process.cwd(), "public/audios");

      const fileName = uuidv4();
      const fileType = file.name.split(".")[1];
      const filePath = path.join(uploadDir, fileName + "." + fileType);

      await fs.writeFile(filePath, buffer);

      return new NextResponse(`File saved as ${fileName}.${fileType}`, {
        status: 200,
      });
    } else {
      return new NextResponse("No file received!", { status: 200 });
    }
  } catch (error) {
    console.error("[ERROR]", error);

    return new NextResponse("Upload failed.", { status: 500 });
  }
}
