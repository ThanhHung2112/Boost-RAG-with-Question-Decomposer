import fs from "node:fs/promises";
import path from "path";

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const fileIds = formData.getAll("fileId") as string[];

    if (!files || files.length === 0) {
      return new NextResponse("No file received!", { status: 200 });
    }

    const uploadDir = path.join(process.cwd(), "public/uploads");

    const promises: Promise<void>[] = [];
    let index = 0;

    for (const file of files) {
      if (!file) {
        continue;
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      const fileType = file.name.split(".")[1];
      const filePath = path.join(uploadDir, `${fileIds[index]}.${fileType}`);

      index++;
      promises.push(fs.writeFile(filePath, buffer));
    }

    await Promise.all(promises);

    return new NextResponse("Files saved", { status: 200 });
  } catch (error) {
    console.error("[ERROR]", error);

    return new NextResponse("Upload failed.", { status: 500 });
  }
}
