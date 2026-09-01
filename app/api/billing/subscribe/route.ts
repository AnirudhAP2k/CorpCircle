/**
 * POST /api/billing/subscribe
 * Body: { plan: "PRO" | "ENTERPRISE", currency?: "USD" | "INR", interval?: "monthly" | "yearly", provider?: "stripe" | "razorpay" }
 *
 * Provider is optional and must match the currency if supplied. Currency is
 * enforced against KYB jurisdiction and the org's locked preferredCurrency.
 */

import { getApiAuth } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import { subscriptionPlans } from "@/constants";
import { createBillingCheckout, BillingError } from "@/domain/billing";
import type { BillingCurrency, BillingInterval, BillingPlan, PaymentProvider } from "@/domain/billing";
import { isBillingCurrency, isBillingInterval } from "@/domain/billing/pricing";
import { readIdempotencyKeyHeader } from "@/lib/payment/idempotency";

export const POST = async (req: NextRequest) => {
    try {
        const authUser = getApiAuth(req);
        const userId = authUser?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { plan, provider, currency, interval } = body as {
            plan: BillingPlan;
            provider?: PaymentProvider;
            currency?: BillingCurrency;
            interval?: BillingInterval;
        };

        if (!subscriptionPlans.includes(plan)) {
            return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
        }
        if (currency !== undefined && !isBillingCurrency(currency)) {
            return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
        }
        if (interval !== undefined && !isBillingInterval(interval)) {
            return NextResponse.json({ error: "Invalid interval" }, { status: 400 });
        }
        if (provider !== undefined && provider !== "stripe" && provider !== "razorpay") {
            return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
        }

        const checkout = await createBillingCheckout({
            userId,
            plan,
            currency,
            interval,
            provider,
            idempotencyKey: readIdempotencyKeyHeader(req.headers),
        });
        return NextResponse.json(checkout, { status: 200 });
    } catch (error: any) {
        if (error instanceof BillingError) {
            return NextResponse.json({ error: error.message }, { status: error.status });
        }

        const razorpayMsg = error?.error?.description ?? error?.description ?? null;
        const stripeMsg = error?.raw?.message ?? null;
        const detail = razorpayMsg ?? stripeMsg ?? error?.message ?? "Unknown error";
        console.error("[billing/subscribe] Error:", detail, "\nFull error:", JSON.stringify(error, null, 2));
        return NextResponse.json(
            { error: "Subscription creation failed", detail },
            { status: 500 }
        );
    }
};
