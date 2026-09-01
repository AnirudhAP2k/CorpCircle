/**
 * POST /api/billing/cancel
 *
 * Cancels the org's active provider subscription (Stripe or Razorpay).
 */

import { NextRequest, NextResponse } from "next/server";
import { getApiAuth } from "@/lib/api-auth";
import { cancelOrgSubscription, BillingError } from "@/domain/billing";

export const POST = async (req: NextRequest) => {
    try {
        const authUser = getApiAuth(req);
        if (!authUser?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await cancelOrgSubscription(authUser.id);
        return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error: any) {
        if (error instanceof BillingError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error("[billing/cancel]", error);
        return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
    }
};
