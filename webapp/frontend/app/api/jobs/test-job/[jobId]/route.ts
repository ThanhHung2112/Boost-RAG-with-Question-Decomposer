import { NextResponse } from "next/server";

import { testQueue } from "@/app/workers/test.worker";

export const GET = async (
  req: Request,
  { params: { jobId } }: { params: { jobId: string } },
) => {
  // if (!validateUUID(jobId)) {
  //     return NextResponse.json({ error: 'Invalid jobId format' }, { status: 400 });
  // }

  try {
    const job = await testQueue.getJob(jobId);

    if (job === null) {
      return NextResponse.json({ state: "not-found" }, { status: 404 });
    }

    const state = await job.getState();

    if (state === "completed") {
      return NextResponse.json({
        state,
        result: job.result,
      });
    }

    return NextResponse.json({ state });
  } catch (error) {
    console.error("Error fetching job state:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
};
