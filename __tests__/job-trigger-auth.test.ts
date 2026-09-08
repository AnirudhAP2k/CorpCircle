/** @jest-environment node */

import { NextRequest } from "next/server";
import { POST } from "@/app/api/jobs/trigger/route";

jest.mock("@/lib/scheduler/cron-jobs", () => ({
    triggerJobProcessing: jest.fn(),
    triggerCleanup: jest.fn(),
    triggerExpireTrials: jest.fn(),
}));

const originalSecret = process.env.JOB_TRIGGER_SECRET;

function request(authorization?: string) {
    return new NextRequest("http://localhost/api/jobs/trigger", {
        method: "POST",
        headers: authorization ? { authorization } : undefined,
        body: JSON.stringify({ type: "jobs" }),
    });
}

describe("job trigger authentication", () => {
    afterEach(() => {
        if (originalSecret === undefined) {
            delete process.env.JOB_TRIGGER_SECRET;
        } else {
            process.env.JOB_TRIGGER_SECRET = originalSecret;
        }
    });

    it("fails closed when JOB_TRIGGER_SECRET is missing", async () => {
        delete process.env.JOB_TRIGGER_SECRET;

        const response = await POST(request("Bearer undefined"));

        expect(response.status).toBe(401);
    });

    it("does not bypass authentication in development", async () => {
        process.env.JOB_TRIGGER_SECRET = "expected-secret";
        const originalNodeEnv = process.env.NODE_ENV;
        Object.defineProperty(process.env, "NODE_ENV", {
            value: "development",
            configurable: true,
        });

        try {
            const response = await POST(request());
            expect(response.status).toBe(401);
        } finally {
            Object.defineProperty(process.env, "NODE_ENV", {
                value: originalNodeEnv,
                configurable: true,
            });
        }
    });

    it("accepts the configured bearer secret", async () => {
        process.env.JOB_TRIGGER_SECRET = "expected-secret";

        const response = await POST(request("Bearer expected-secret"));

        expect(response.status).toBe(200);
    });
});
