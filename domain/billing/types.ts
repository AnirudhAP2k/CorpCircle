import type { CatalogCurrency } from "@/lib/plan-catalog";
import type { BillingCurrency, BillingPlan } from "./gateway/types";
import type {
	PaymentProvider as PrismaPaymentProvider,
	SubscriptionStatus,
} from "@prisma/client";

export type AllPlans = BillingPlan | "FREE";

export interface PlanCopy {
	name: AllPlans;
	description: string;
	features: string[];
	badge?: string;
	highlighted?: boolean;
}

export const PLANS: PlanCopy[] = [
	{
		name: "FREE",
		description: "For small orgs getting started",
		features: [
			"Up to 3 active public events",
			"Max 50 attendees per event",
			"Basic event management",
			"Org profiles & discovery",
			"Community support",
		],
	},
	{
		name: "PRO",
		description: "For growing B2B networks",
		features: [
			"Unlimited events & attendees",
			"AI matchmaking recommendations",
			"Org analytics dashboard",
			"PLATFORM & EXTERNAL payment modes",
			"Pre-event meeting scheduling",
			"Priority email support",
			"2% platform fee on payments",
		],
		badge: "Most Popular",
		highlighted: true,
	},
	{
		name: "ENTERPRISE",
		description: "For large enterprises & consortiums",
		features: [
			"Everything in PRO",
			"Semantic search (pgvector)",
			"API access + webhooks",
			"Industry group creation",
			"Dedicated account manager",
			"1% platform fee on payments",
			"Custom integrations",
		],
		badge: "Contact sales",
	},
];

export interface PricingPlansProps {
	currentPlan?: AllPlans;
	preferredCurrency?: CatalogCurrency;
	inrEligible?: boolean;
	currencyLocked?: boolean;
}

export interface ProviderPickerProps {
	eventId: string;
	eventTitle: string;
	price: string;
	currency: string;
	onClose: () => void;
	onSuccess?: () => void;
}

export interface BillingStatus {
	plan: AllPlans;
	status: SubscriptionStatus | null;
	expiresAt: Date | null;
	isVerified: boolean;
	preferredCurrency: BillingCurrency;
	latestSubscription: {
		provider: PrismaPaymentProvider;
		plan: AllPlans;
		status: SubscriptionStatus;
		currentPeriodEnd: Date;
	} | null;
}

export interface PlanPriceEntry {
	amountMinor: number;
	stripePriceId: string;
	razorpayPlanId: string;
}
