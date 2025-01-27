import { NextResponse } from "next/server";

import { appendCsv } from "@/lib/fast-csv";
import { createCsvHeader } from "@/lib/fast-csv/create-csv-header";
import { fileExists } from "@/lib/fast-csv/exist-csv";

export async function POST(request: Request): Promise<NextResponse> {
  const { jobId, queueName, action, jobPayload, createdAt } =
    await request.json();

  if (!jobId || !queueName || !action || !jobPayload || !createdAt) {
    return new NextResponse("Bad request", { status: 400 });
  }

  try {
    const jobsDirectory = "storage/jobs";

    if (!fileExists("jobs", jobsDirectory)) {
      await createCsvHeader(
        ["id", "queue", "action", "payload", "created_at"],
        "jobs",
        jobsDirectory,
      );
    }

    const job = {
      id: jobId,
      queue: queueName,
      action: action,
      payload: JSON.stringify(jobPayload),
      created_at: createdAt,
    };

    appendCsv([job], "jobs", jobsDirectory);

    return NextResponse.json({ jobId });
  } catch (error) {
    console.error(error);

    return new NextResponse("Internal error", { status: 500 });
  }
}
