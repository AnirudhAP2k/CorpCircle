/**
 * domain/billing/service.ts
 *
 * Billing business logic (auth-context in, provider-agnostic out). Routes stay
 * thin: they authenticate, parse input, call these functions, and map
 * BillingError → HTTP status.
 */

import { prisma } from "@/lib/db";
import { getPaymentGateway } from "./gateway";
import { BillingError } from "./errors";
import type {
    BillingCurrency,
    BillingInterval,
    BillingOrg,
    BillingPlan,
    PaymentProvider,
    PortalSession,
    SubscriptionCheckout,
} from "./gateway/types";
import {
    currencyFromJurisdiction,
    isBillingCurrency,
    isBillingInterval,
    isCurrencyLocked,
    isInrEligible,
    providerForCurrency,
    providerPriceId,
} from "./pricing";

const appUrl = (): string => {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** Resolves the user's active org and asserts OWNER/ADMIN billing permission. */
async function resolveBillingOrg(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { activeOrganizationId: true },
    });
    if (!user?.activeOrganizationId) {
        throw new BillingError(400, "No active organization. Please select an organization first.");
    }

    const orgId = user.activeOrganizationId;

    const membership = await prisma.organizationMember.findUnique({
        where: { userId_organizationId: { userId, organizationId: orgId } },
        select: { role: true },
    });
    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
        throw new BillingError(403, "Only OWNER or ADMIN can manage billing");
    }

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: {
            id: true,
            name: true,
            stripeCustomerId: true,
            razorpayCustomerId: true,
            preferredCurrency: true,
            subscriptionPlan: true,
            subscriptionStatus: true,
            meta: { select: { jurisdiction: true } },
        },
    });
    if (!org) {
        throw new BillingError(404, "Organization not found");
    }

    return org;
}

type BillingOrgRecord = Awaited<ReturnType<typeof resolveBillingOrg>>;

function billingOrgPort(org: BillingOrgRecord): BillingOrg {
    return {
        id: org.id,
        name: org.name,
        stripeCustomerId: org.stripeCustomerId,
        razorpayCustomerId: org.razorpayCustomerId,
    };
}

function resolveCheckoutCurrency(
    org: BillingOrgRecord,
    requested: BillingCurrency | undefined,
): BillingCurrency {
    const locked = isCurrencyLocked(org.subscriptionPlan, org.subscriptionStatus);
    const stored = isBillingCurrency(org.preferredCurrency) ? org.preferredCurrency : "USD";

    if (locked) {
        if (requested && requested !== stored) {
            throw new BillingError(
                400,
                `Currency is locked to ${stored} while a paid subscription is active. Cancel and resubscribe to change it.`,
            );
        }
        return stored;
    }

    return requested ?? stored;
}

function assertCurrencyEligibility(org: BillingOrgRecord, currency: BillingCurrency): void {
    if (currency === "INR" && !isInrEligible(org.meta?.jurisdiction)) {
        throw new BillingError(
            400,
            "INR billing is only available to organizations with an Indian KYB jurisdiction. Complete KYB with jurisdiction IN, or subscribe in USD.",
        );
    }
}

export async function createBillingCheckout(input: {
    userId: string;
    plan: BillingPlan;
    currency?: BillingCurrency;
    interval?: BillingInterval;
    provider?: PaymentProvider;
    idempotencyKey?: string;
}): Promise<SubscriptionCheckout> {
    if (input.plan === "ENTERPRISE") {
        throw new BillingError(400, "Enterprise is billed through sales. Use the contact form.");
    }

    const interval: BillingInterval = input.interval ?? "monthly";
    if (!isBillingInterval(interval)) {
        throw new BillingError(400, "Invalid billing interval");
    }

    const org = await resolveBillingOrg(input.userId);
    const currency = resolveCheckoutCurrency(org, input.currency);
    assertCurrencyEligibility(org, currency);

    const provider = providerForCurrency(currency);
    if (input.provider && input.provider !== provider) {
        throw new BillingError(
            400,
            `${currency} is billed through ${provider === "razorpay" ? "Razorpay" : "Stripe"}.`,
        );
    }

    const activePaid =
        isCurrencyLocked(org.subscriptionPlan, org.subscriptionStatus);
    if (activePaid) {
        throw new BillingError(
            400,
            "An active paid subscription already exists. Cancel it before changing plan or interval.",
        );
    }

    const priceId = providerPriceId(input.plan, currency, interval);
    if (!priceId) {
        throw new BillingError(
            500,
            `Price ID for ${input.plan} ${currency} ${interval} is not configured`,
        );
    }

    if (!isCurrencyLocked(org.subscriptionPlan, org.subscriptionStatus) && org.preferredCurrency !== currency) {
        await prisma.organization.update({
            where: { id: org.id },
            data: { preferredCurrency: currency },
        });
    }

    const gateway = getPaymentGateway(provider);
    return gateway.createSubscriptionCheckout({
        org: billingOrgPort(org),
        plan: input.plan,
        interval,
        priceId,
        appUrl: appUrl(),
        idempotencyKey: input.idempotencyKey,
    });
}

export async function createBillingPortal(userId: string): Promise<PortalSession> {
    const org = await resolveBillingOrg(userId);

    const latest = await prisma.orgSubscription.findFirst({
        where: { organizationId: org.id, status: { in: ["ACTIVE", "PAST_DUE"] } },
        orderBy: { createdAt: "desc" },
        select: { provider: true },
    });
    if (latest?.provider === "RAZORPAY") {
        throw new BillingError(
            400,
            "Razorpay subscriptions are managed in-app. Use Cancel subscription on the billing page.",
        );
    }

    const gateway = getPaymentGateway("stripe");
    return gateway.createPortalSession(billingOrgPort(org), appUrl());
}

export async function cancelOrgSubscription(userId: string): Promise<void> {
    const org = await resolveBillingOrg(userId);

    const sub = await prisma.orgSubscription.findFirst({
        where: { organizationId: org.id, status: { in: ["ACTIVE", "PAST_DUE"] } },
        orderBy: { createdAt: "desc" },
        select: { provider: true, providerSubscriptionId: true },
    });
    if (!sub) {
        throw new BillingError(400, "No active subscription to cancel.");
    }

    const provider: PaymentProvider = sub.provider === "RAZORPAY" ? "razorpay" : "stripe";
    const gateway = getPaymentGateway(provider);
    await gateway.cancelSubscription(sub.providerSubscriptionId);

    await prisma.orgSubscription.update({
        where: { providerSubscriptionId: sub.providerSubscriptionId },
        data: { status: "CANCELLED", cancelledAt: new Date() },
    });
}

export async function updatePreferredCurrency(
    userId: string,
    currency: BillingCurrency,
): Promise<{ preferredCurrency: BillingCurrency; locked: boolean }> {
    if (!isBillingCurrency(currency)) {
        throw new BillingError(400, "Currency must be USD or INR");
    }

    const org = await resolveBillingOrg(userId);
    const locked = isCurrencyLocked(org.subscriptionPlan, org.subscriptionStatus);
    if (locked) {
        throw new BillingError(
            400,
            `Currency is locked to ${org.preferredCurrency} while a paid subscription is active.`,
        );
    }

    assertCurrencyEligibility(org, currency);

    await prisma.organization.update({
        where: { id: org.id },
        data: { preferredCurrency: currency },
    });

    return { preferredCurrency: currency, locked: false };
}

/** Apply jurisdiction → preferredCurrency when KYB is saved and currency is not locked. */
export async function syncPreferredCurrencyFromJurisdiction(
    orgId: string,
    jurisdiction: string | null | undefined,
): Promise<void> {
    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: { subscriptionPlan: true, subscriptionStatus: true },
    });
    if (!org) return;
    if (isCurrencyLocked(org.subscriptionPlan, org.subscriptionStatus)) return;

    await prisma.organization.update({
        where: { id: orgId },
        data: { preferredCurrency: currencyFromJurisdiction(jurisdiction) },
    });
}

/**
 * Confirms a paid event registration after the gateway redirect. The webhook
 * writes the same rows, so both paths are guarded to stay idempotent.
 */
export async function confirmPaidParticipation(input: {
    participationId: string;
    paymentIntentId: string | null;
    receiptUrl: string | null;
}): Promise<void> {
    const { participationId, paymentIntentId, receiptUrl } = input;

    await prisma.$transaction(async (tx) => {
        await tx.eventParticipation.updateMany({
            where: {
                id: participationId,
                status: "PENDING_PAYMENT", // only update if still pending
            },
            data: { isPaid: true, status: "REGISTERED" },
        });

        // Without a payment intent there is nothing to reconcile the payment row against.
        if (!paymentIntentId) return;

        await tx.eventPayment.updateMany({
            where: { participationId },
            data: { status: "SUCCEEDED", receiptUrl },
        });
    });
}

export interface BillingStatus {
    plan: string;
    status: string | null;
    expiresAt: Date | null;
    isVerified: boolean;
    preferredCurrency: string;
    latestSubscription: {
        provider: string;
        plan: string;
        status: string;
        currentPeriodEnd: Date;
    } | null;
}

export async function getBillingStatus(userId: string): Promise<BillingStatus> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { activeOrganizationId: true },
    });
    if (!user?.activeOrganizationId) {
        throw new BillingError(400, "No active organization");
    }

    const orgId = user.activeOrganizationId;

    const org = await prisma.organization.findUnique({
        where: { id: orgId },
        select: {
            subscriptionPlan: true,
            subscriptionStatus: true,
            subscriptionExpiresAt: true,
            isVerified: true,
            preferredCurrency: true,
        },
    });
    if (!org) {
        throw new BillingError(404, "Organization not found");
    }

    const latestSub = await prisma.orgSubscription.findFirst({
        where: { organizationId: orgId },
        orderBy: { createdAt: "desc" },
        select: { provider: true, plan: true, status: true, currentPeriodEnd: true },
    });

    return {
        plan: org.subscriptionPlan,
        status: org.subscriptionStatus,
        expiresAt: org.subscriptionExpiresAt,
        isVerified: org.isVerified,
        preferredCurrency: org.preferredCurrency,
        latestSubscription: latestSub ?? null,
    };
}
