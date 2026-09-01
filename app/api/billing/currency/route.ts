/**
 * PATCH /api/billing/currency
 * Body: { currency: "USD" | "INR" }
 *
 * Sets preferredCurrency when it is not locked by an active paid subscription.
 */

import { NextRequest, NextResponse } from "next/server";
import { getApiAuth } from "@/lib/api-auth";
import { updatePreferredCurrency, BillingError } from "@/domain/billing";
import { isBillingCurrency } from "@/domain/billing/pricing";

export const PATCH = async (req: NextRequest) => {
    try {
        const authUser = getApiAuth(req);
        if (!authUser?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        if (!isBillingCurrency(body.currency)) {
            return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
        }

        const result = await updatePreferredCurrency(authUser.id, body.currency);
        return NextResponse.json(result, { status: 200 });
    } catch (error: any) {
        if (error instanceof BillingError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }
        console.error("[billing/currency]", error);
        return NextResponse.json({ error: "Failed to update currency" }, { status: 500 });
    }
};
