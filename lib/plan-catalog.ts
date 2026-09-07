/**
 * Public catalog of subscription amounts (minor units). No provider secrets.
 * Safe to import from Client Components.
 */

import { formatMoney } from "@/lib/money";

export type CatalogPlan = "PRO" | "ENTERPRISE";
export type CatalogCurrency = "USD" | "INR";
export type CatalogInterval = "monthly" | "yearly";

const YEARLY_MULTIPLIER = 10;

const PRO_USD_MONTHLY = 4900;
const PRO_INR_MONTHLY = 199_900;
const ENTERPRISE_USD_MONTHLY = 12_000;
const ENTERPRISE_INR_MONTHLY = 999_900;

export const PLAN_AMOUNTS: Record<
    CatalogPlan,
    Record<CatalogCurrency, Record<CatalogInterval, number>>
> = {
    PRO: {
        USD: { monthly: PRO_USD_MONTHLY, yearly: PRO_USD_MONTHLY * YEARLY_MULTIPLIER },
        INR: { monthly: PRO_INR_MONTHLY, yearly: PRO_INR_MONTHLY * YEARLY_MULTIPLIER },
    },
    ENTERPRISE: {
        USD: { monthly: ENTERPRISE_USD_MONTHLY, yearly: ENTERPRISE_USD_MONTHLY * YEARLY_MULTIPLIER },
        INR: { monthly: ENTERPRISE_INR_MONTHLY, yearly: ENTERPRISE_INR_MONTHLY * YEARLY_MULTIPLIER },
    },
};

export function displayPlanPrice(
    plan: CatalogPlan,
    currency: CatalogCurrency,
    interval: CatalogInterval,
): string {
    return formatMoney(PLAN_AMOUNTS[plan][currency][interval], currency);
}

export function providerForCurrency(currency: CatalogCurrency): "stripe" | "razorpay" {
    return currency === "INR" ? "razorpay" : "stripe";
}
