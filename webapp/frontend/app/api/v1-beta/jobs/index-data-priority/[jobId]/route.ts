import { NextResponse } from "next/server";

import { indexDataQueue } from "@/app/workers/index-data.worker";

export const GET = async (
  req: Request,
  { params: { jobId } }: { params: { jobId: string } },
) => {
  try {
    const job = await indexDataQueue.getJob(jobId);

    if (job === null) {
      return NextResponse.json({ state: "not-found" }, { status: 404 });
    }

    const state = await job.getState();

    if (state === "completed") {
      return NextResponse.json({
        status: "finished",
        result: job.result,
      });
    }

    return NextResponse.json({ status: state });
  } catch (error) {
    console.error("Error fetching job state:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
};
