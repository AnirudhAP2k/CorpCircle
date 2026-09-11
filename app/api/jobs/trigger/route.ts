import { NextRequest, NextResponse } from "next/server";
import {
    triggerJobProcessing,
    triggerCleanup,
    triggerExpireTrials,
} from "@/lib/scheduler/cron-jobs";

export const POST = async (req: NextRequest) => {
    try {
        const authHeader = req.headers.get("authorization");
        const triggerSecret = process.env.JOB_TRIGGER_SECRET;
        const isAuthorized =
            Boolean(triggerSecret) &&
            authHeader === `Bearer ${triggerSecret}`;

        if (!isAuthorized) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { type } = await req.json();

        switch (type) {
            case "jobs":
                await triggerJobProcessing();
                return NextResponse.json({
                    message: "Job queue processing triggered successfully",
                });

            case "cleanup":
                await triggerCleanup();
                return NextResponse.json({
                    message: "Cleanup triggered successfully",
                });

            case "trials": {
                const result = await triggerExpireTrials();
                return NextResponse.json({
                    message: "Trial expiry sweep completed",
                    ...result,
                });
            }

            case "all": {
                await triggerJobProcessing();
                const result = await triggerExpireTrials();
                return NextResponse.json({
                    message: "All jobs triggered successfully",
                    trials: result,
                });
            }

            default:
                return NextResponse.json(
                    { error: "Invalid job type. Use: jobs, cleanup, trials, or all" },
                    { status: 400 }
                );
        }
    } catch (error: any) {
        console.error("Job trigger error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
};
