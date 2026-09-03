/**
 * Server-side plan prices plus provider IDs. Client UI should import amounts
 * from `@/lib/plan-catalog` so env price IDs never ship to the browser.
 */

import type {
	BillingPlan,
	BillingCurrency,
	BillingInterval,
	PaymentProvider,
} from "./gateway/types";
import { PLAN_AMOUNTS } from "@/lib/plan-catalog";
import type { AllPlans, PlanPriceEntry } from "./types";
import type { SubscriptionStatus } from "@prisma/client";

export type { BillingCurrency, BillingInterval };

const idsFor = (
	plan: BillingPlan,
	currency: BillingCurrency,
	interval: BillingInterval,
): {
	stripePriceId: string;
	razorpayPlanId: string;
} => {
	if (plan === "PRO" && currency === "USD" && interval === "monthly") {
		return {
			stripePriceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
			razorpayPlanId: "",
		};
	}
	if (plan === "PRO" && currency === "USD" && interval === "yearly") {
		return {
			stripePriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID ?? "",
			razorpayPlanId: "",
		};
	}
	if (plan === "PRO" && currency === "INR" && interval === "monthly") {
		return {
			stripePriceId: "",
			razorpayPlanId: process.env.RAZORPAY_PRO_PLAN_ID ?? "",
		};
	}
	if (plan === "PRO" && currency === "INR" && interval === "yearly") {
		return {
			stripePriceId: "",
			razorpayPlanId: process.env.RAZORPAY_PRO_YEARLY_PLAN_ID ?? "",
		};
	}
	if (plan === "ENTERPRISE" && currency === "USD" && interval === "monthly") {
		return {
			stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? "",
			razorpayPlanId: "",
		};
	}
	if (plan === "ENTERPRISE" && currency === "USD" && interval === "yearly") {
		return {
			stripePriceId: process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID ?? "",
			razorpayPlanId: "",
		};
	}
	if (plan === "ENTERPRISE" && currency === "INR" && interval === "monthly") {
		return {
			stripePriceId: "",
			razorpayPlanId: process.env.RAZORPAY_ENTERPRISE_PLAN_ID ?? "",
		};
	}
	return {
		stripePriceId: "",
		razorpayPlanId: process.env.RAZORPAY_ENTERPRISE_YEARLY_PLAN_ID ?? "",
	};
};

export function getPlanPrice(
	plan: BillingPlan,
	currency: BillingCurrency,
	interval: BillingInterval,
): PlanPriceEntry {
	const amountMinor = PLAN_AMOUNTS[plan][currency][interval];
	const { stripePriceId, razorpayPlanId } = idsFor(plan, currency, interval);
	return { amountMinor, stripePriceId, razorpayPlanId };
}

export const BILLING_CURRENCIES: BillingCurrency[] = ["USD", "INR"];
export const BILLING_INTERVALS: BillingInterval[] = ["monthly", "yearly"];

export function isBillingCurrency(value: unknown): value is BillingCurrency {
	return value === "USD" || value === "INR";
}

export function isBillingInterval(value: unknown): value is BillingInterval {
	return value === "monthly" || value === "yearly";
}

export function providerForCurrency(
	currency: BillingCurrency,
): PaymentProvider {
	return currency === "INR" ? "razorpay" : "stripe";
}

export function currencyForProvider(
	provider: PaymentProvider,
): BillingCurrency {
	return provider === "razorpay" ? "INR" : "USD";
}

export function isInrEligible(
	jurisdiction: string | null | undefined,
): boolean {
	return (jurisdiction ?? "").trim().toUpperCase() === "IN";
}

export function currencyFromJurisdiction(
	jurisdiction: string | null | undefined,
): BillingCurrency {
	return isInrEligible(jurisdiction) ? "INR" : "USD";
}

/**
 * Paid (non-trial) subscriptions lock currency so a US org cannot switch to INR
 * mid-cycle. TRIALING and FREE remain unlocked.
 */
export const isCurrencyLocked = (
	subscriptionPlan: AllPlans,
	subscriptionStatus: SubscriptionStatus,
): boolean => {
	if (subscriptionPlan === "FREE") return false;
	return subscriptionStatus === "ACTIVE" || subscriptionStatus === "PAST_DUE";
};

export const providerPriceId = (
	plan: BillingPlan,
	currency: BillingCurrency,
	interval: BillingInterval,
): string => {
	const row = getPlanPrice(plan, currency, interval);
	return currency === "INR" ? row.razorpayPlanId : row.stripePriceId;
};

/** Convenience tree: PLAN_PRICING.PRO.USD.monthly */
export const PLAN_PRICING = {
	PRO: {
		USD: {
			get monthly() {
				return getPlanPrice("PRO", "USD", "monthly");
			},
			get yearly() {
				return getPlanPrice("PRO", "USD", "yearly");
			},
		},
		INR: {
			get monthly() {
				return getPlanPrice("PRO", "INR", "monthly");
			},
			get yearly() {
				return getPlanPrice("PRO", "INR", "yearly");
			},
		},
	},
	ENTERPRISE: {
		USD: {
			get monthly() {
				return getPlanPrice("ENTERPRISE", "USD", "monthly");
			},
			get yearly() {
				return getPlanPrice("ENTERPRISE", "USD", "yearly");
			},
		},
		INR: {
			get monthly() {
				return getPlanPrice("ENTERPRISE", "INR", "monthly");
			},
			get yearly() {
				return getPlanPrice("ENTERPRISE", "INR", "yearly");
			},
		},
	},
};
