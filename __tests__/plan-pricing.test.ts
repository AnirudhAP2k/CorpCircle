import { formatMoney, formatMajorAmount } from "@/lib/money";
import { PLAN_AMOUNTS, displayPlanPrice } from "@/lib/plan-catalog";
import {
    currencyFromJurisdiction,
    isCurrencyLocked,
    isInrEligible,
    providerForCurrency,
} from "@/domain/billing/pricing";

describe("formatMoney", () => {
    it("formats USD cents without fractional cents", () => {
        expect(formatMoney(4900, "USD")).toBe("$49");
    });

    it("formats INR paise with the Indian grouping", () => {
        expect(formatMoney(199900, "INR")).toBe("₹1,999");
    });

    it("formats a major-unit ticket price", () => {
        expect(formatMajorAmount("29.99", "USD")).toBe("$30");
    });
});

describe("plan catalog", () => {
    it("prices Pro at $49 monthly and 10× yearly", () => {
        expect(PLAN_AMOUNTS.PRO.USD.monthly).toBe(4900);
        expect(PLAN_AMOUNTS.PRO.USD.yearly).toBe(49000);
        expect(displayPlanPrice("PRO", "USD", "monthly")).toBe("$49");
    });

    it("prices Pro INR in the PPP band, not a USD conversion", () => {
        expect(PLAN_AMOUNTS.PRO.INR.monthly).toBe(199900);
    });
});

describe("currency policy", () => {
    it("does not treat empty jurisdiction as India", () => {
        expect(isInrEligible(null)).toBe(false);
        expect(isInrEligible("")).toBe(false);
        expect(currencyFromJurisdiction(undefined)).toBe("USD");
        expect(currencyFromJurisdiction("IN")).toBe("INR");
    });

    it("derives the gateway from currency", () => {
        expect(providerForCurrency("INR")).toBe("razorpay");
        expect(providerForCurrency("USD")).toBe("stripe");
    });

    it("locks currency only for paid active subscriptions", () => {
        expect(isCurrencyLocked("PRO", "TRIALING")).toBe(false);
        expect(isCurrencyLocked("FREE", "ACTIVE")).toBe(false);
        expect(isCurrencyLocked("PRO", "ACTIVE")).toBe(true);
        expect(isCurrencyLocked("PRO", "PAST_DUE")).toBe(true);
    });
});
