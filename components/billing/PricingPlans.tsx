"use client";

/**
 * Three-column pricing cards (FREE / PRO / ENTERPRISE) driven by PLAN_PRICING.
 * Yearly actually bills yearly. Currency selects the gateway (USD→Stripe, INR→Razorpay).
 */

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { displayPlanPrice, providerForCurrency } from "@/lib/plan-catalog";
import type { CatalogCurrency, CatalogInterval } from "@/lib/plan-catalog";
import { formatMoney } from "@/lib/money";
import type { AllPlans, PricingPlansProps } from "@/domain/billing/types";
import { PLANS } from "@/domain/billing/types";

export function PricingPlans({
	currentPlan = "FREE",
	preferredCurrency = "USD",
	inrEligible = false,
	currencyLocked = false,
}: PricingPlansProps) {
	const [interval, setInterval] = useState<CatalogInterval>("monthly");
	const [currency, setCurrency] = useState<CatalogCurrency>(preferredCurrency);
	const [isPending, startTransition] = useTransition();
	const [loadingPlan, setLoadingPlan] = useState<AllPlans | null>(null);

	const activeCurrency = currencyLocked ? preferredCurrency : currency;

	const handleSubscribe = (plan: AllPlans) => {
		if (plan === "FREE" || plan === "ENTERPRISE") return;

		setLoadingPlan(plan);
		startTransition(async () => {
			try {
				const res = await fetch("/api/billing/subscribe", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						plan,
						currency: activeCurrency,
						interval,
						provider: providerForCurrency(activeCurrency),
					}),
				});
				const data = await res.json();
				if (data.url) {
					window.location.href = data.url;
				} else {
					toast.error(data.error ?? "Failed to start checkout");
				}
			} catch {
				toast.error("Something went wrong. Please try again.");
			} finally {
				setLoadingPlan(null);
			}
		});
	};

	const selectCurrency = (next: CatalogCurrency) => {
		if (currencyLocked) {
			toast.error("Currency is locked while a paid subscription is active.");
			return;
		}
		if (next === "INR" && !inrEligible) {
			toast.error("INR billing requires an Indian KYB jurisdiction (IN).");
			return;
		}
		setCurrency(next);
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center flex-wrap gap-3">
				<div className="inline-flex items-center bg-nx-surface-container rounded-full p-1">
					<button
						type="button"
						className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
							interval === "monthly"
								? "bg-nx-primary text-nx-on-primary shadow-nx-primary"
								: "text-nx-on-surface-variant hover:text-nx-on-surface"
						}`}
						onClick={() => setInterval("monthly")}
					>
						Monthly
					</button>
					<button
						type="button"
						className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
							interval === "yearly"
								? "bg-nx-primary text-nx-on-primary shadow-nx-primary"
								: "text-nx-on-surface-variant hover:text-nx-on-surface"
						}`}
						onClick={() => setInterval("yearly")}
					>
						Yearly
						<span className="px-1.5 py-0.5 rounded-full text-[0.6rem] font-bold bg-nx-on-tertiary-container text-white">
							2 months free
						</span>
					</button>
				</div>

				<div className="inline-flex items-center bg-nx-surface-container rounded-full p-1 gap-1">
					<span className="text-xs text-nx-on-surface-variant px-2 font-medium">
						Currency
					</span>
					<button
						type="button"
						className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
							activeCurrency === "USD"
								? "bg-nx-primary text-nx-on-primary"
								: "text-nx-on-surface-variant hover:text-nx-on-surface"
						}`}
						onClick={() => selectCurrency("USD")}
					>
						USD
					</button>
					<button
						type="button"
						className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
							activeCurrency === "INR"
								? "bg-nx-primary text-nx-on-primary"
								: "text-nx-on-surface-variant hover:text-nx-on-surface"
						}`}
						onClick={() => selectCurrency("INR")}
					>
						INR
					</button>
				</div>
			</div>

			{currencyLocked && (
				<p className="text-xs text-nx-on-surface-variant">
					Billing currency is locked to {preferredCurrency} for the active
					subscription.
				</p>
			)}
			{!inrEligible && !currencyLocked && (
				<p className="text-xs text-nx-on-surface-variant">
					INR (Razorpay) is available after KYB with jurisdiction IN. Until
					then, subscribe in USD.
				</p>
			)}

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
				{PLANS.map((plan) => {
					const isCurrent = plan.name === currentPlan;
					const isPaid = plan.name === "PRO";
					const price =
						plan.name === "FREE"
							? formatMoney(0, activeCurrency)
							: plan.name === "ENTERPRISE"
								? "Custom"
								: displayPlanPrice("PRO", activeCurrency, interval);
					const isLoading = loadingPlan === plan.name && isPending;

					return (
						<div
							key={plan.name}
							className={`relative bg-nx-surface-container-lowest rounded-2xl p-6 flex flex-col gap-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-nx-float ${
								plan.highlighted
									? "shadow-nx-float ring-1 ring-nx-on-tertiary-container/30"
									: "shadow-nx-card"
							} ${isCurrent ? "opacity-75" : ""}`}
						>
							{plan.badge && (
								<div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider bg-nx-cta-gradient text-white whitespace-nowrap">
									{plan.badge}
								</div>
							)}

							<div className="flex flex-col gap-1">
								<h3 className="text-sm font-bold text-nx-on-surface uppercase tracking-wider">
									{plan.name}
								</h3>
								<div className="flex items-baseline gap-1">
									<span className="text-3xl font-bold text-nx-on-surface">
										{price}
									</span>
									{isPaid && (
										<span className="text-sm text-nx-on-surface-variant">
											/{interval === "monthly" ? "mo" : "yr"}
										</span>
									)}
								</div>
								<p className="text-xs text-nx-on-surface-variant">
									{plan.description}
								</p>
							</div>

							<ul className="flex flex-col gap-2.5 flex-1">
								{plan.features.map((f) => (
									<li
										key={f}
										className="flex items-start gap-2 text-sm text-nx-on-surface-variant"
									>
										<span className="text-nx-on-tertiary-container font-bold shrink-0 mt-0.5">
											✓
										</span>
										{f}
									</li>
								))}
							</ul>

							{plan.name === "ENTERPRISE" ? (
								<Link
									href="/contact"
									className="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-nx-surface-container-high text-nx-on-surface-variant hover:bg-nx-surface-container-highest"
								>
									Contact sales
								</Link>
							) : (
								<button
									type="button"
									className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
										plan.highlighted
											? "bg-nx-cta-gradient text-nx-on-primary hover:shadow-nx-primary"
											: "bg-nx-surface-container-high text-nx-on-surface-variant hover:bg-nx-surface-container-highest"
									} ${isCurrent ? "opacity-50 cursor-default" : ""}`}
									onClick={() => handleSubscribe(plan.name)}
									disabled={isCurrent || plan.name === "FREE" || isLoading}
								>
									{isLoading
										? "Redirecting…"
										: isCurrent
											? "Current Plan"
											: plan.name === "FREE"
												? "Free Forever"
												: `Upgrade to ${plan.name}`}
								</button>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
