"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FREE_FEATURES, PRO_FEATURES, ENTERPRISE_FEATURES } from "@/constants";
import { displayPlanPrice } from "@/lib/plan-catalog";
import type { CatalogCurrency, CatalogInterval } from "@/lib/plan-catalog";
import { formatMoney } from "@/lib/money";

interface PublicPricingProps {
    isSignedIn: boolean;
}

export function PublicPricing({ isSignedIn }: PublicPricingProps) {
    const [currency, setCurrency] = useState<CatalogCurrency>("USD");
    const [interval, setInterval] = useState<CatalogInterval>("monthly");

    const proPrice = displayPlanPrice("PRO", currency, interval);
    const period = interval === "monthly" ? "/month" : "/year";

    return (
        <div className="bg-nx-surface min-h-screen">
            <header className="pt-20 pb-16 text-center max-w-3xl mx-auto px-4">
                <span className="inline-block text-nx-on-tertiary-container font-label font-semibold tracking-[0.12em] uppercase text-xs mb-5">
                    Tailored Professional Networking
                </span>
                <h1 className="font-headline text-5xl md:text-6xl font-extrabold text-nx-primary tracking-tight leading-[1.08] mb-6">
                    Invest in Your{" "}
                    <span className="text-nx-on-tertiary-container">
                        Professional Capital.
                    </span>
                </h1>
                <p className="text-nx-on-surface-variant text-lg leading-relaxed max-w-2xl mx-auto">
                    Choose the tier that aligns with your growth trajectory. From
                    foundational networking to enterprise-scale strategic expansion.
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <div className="inline-flex items-center bg-nx-surface-container rounded-full p-1">
                        <button
                            type="button"
                            className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                                interval === "monthly"
                                    ? "bg-nx-primary text-nx-on-primary"
                                    : "text-nx-on-surface-variant"
                            }`}
                            onClick={() => setInterval("monthly")}
                        >
                            Monthly
                        </button>
                        <button
                            type="button"
                            className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                                interval === "yearly"
                                    ? "bg-nx-primary text-nx-on-primary"
                                    : "text-nx-on-surface-variant"
                            }`}
                            onClick={() => setInterval("yearly")}
                        >
                            Yearly · 2 months free
                        </button>
                    </div>
                    <div className="inline-flex items-center bg-nx-surface-container rounded-full p-1">
                        <button
                            type="button"
                            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                                currency === "USD" ? "bg-nx-primary text-nx-on-primary" : "text-nx-on-surface-variant"
                            }`}
                            onClick={() => setCurrency("USD")}
                        >
                            USD
                        </button>
                        <button
                            type="button"
                            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                                currency === "INR" ? "bg-nx-primary text-nx-on-primary" : "text-nx-on-surface-variant"
                            }`}
                            onClick={() => setCurrency("INR")}
                        >
                            INR
                        </button>
                    </div>
                </div>
                <p className="text-xs text-nx-on-surface-variant mt-3">
                    Display only. The currency charged at checkout is set from your organization&apos;s KYB jurisdiction.
                </p>
            </header>

            <section className="max-w-6xl mx-auto px-4 md:px-8 pb-24">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                    <div className="bg-nx-surface-container-low rounded-3xl p-10 flex flex-col transition-all duration-300 hover:bg-nx-surface-container-high border border-transparent hover:border-nx-surface-variant group">
                        <div className="mb-8">
                            <h2 className="font-headline text-2xl font-bold text-nx-primary mb-1">FREE</h2>
                            <p className="text-nx-on-surface-variant text-sm mb-6">Foundational Networking</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-headline font-extrabold text-nx-primary">
                                    {formatMoney(0, currency)}
                                </span>
                                <span className="text-nx-on-surface-variant text-sm">{period}</span>
                            </div>
                        </div>
                        <ul className="space-y-4 mb-10 flex-grow">
                            {FREE_FEATURES.map((f) => (
                                <li key={f} className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-nx-primary text-xl shrink-0 mt-0.5">check_circle</span>
                                    <span className="text-nx-on-surface text-sm">{f}</span>
                                </li>
                            ))}
                        </ul>
                        <Button asChild variant="outline" className="w-full py-6 rounded-xl border-2 border-nx-primary text-nx-primary font-headline font-bold text-sm tracking-wide uppercase hover:bg-nx-primary hover:text-white transition-all duration-200">
                            <Link href="/register">Get Started — Free</Link>
                        </Button>
                    </div>

                    <div className="relative bg-nx-primary-container rounded-3xl p-10 flex flex-col shadow-2xl ring-4 ring-nx-tertiary-container z-10 scale-[1.03] lg:scale-[1.04]">
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-nx-on-tertiary-container text-nx-primary px-5 py-1.5 rounded-full text-xs font-headline font-bold tracking-widest uppercase shadow-lg whitespace-nowrap">
                            Best Value
                        </div>
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-1">
                                <Zap className="w-5 h-5 text-nx-on-tertiary-container" />
                                <h2 className="font-headline text-2xl font-bold text-white">PRO</h2>
                            </div>
                            <p className="text-nx-on-primary-container text-sm mb-6">Strategic Professional Growth</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-headline font-extrabold text-white">{proPrice}</span>
                                <span className="text-nx-on-primary-container text-sm">{period}</span>
                            </div>
                        </div>
                        <ul className="space-y-4 mb-10 flex-grow">
                            {PRO_FEATURES.map((f) => (
                                <li key={f} className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-nx-on-tertiary-container text-xl shrink-0 mt-0.5">verified</span>
                                    <span className="text-white text-sm font-medium">{f}</span>
                                </li>
                            ))}
                        </ul>
                        <Button asChild className="w-full py-6 rounded-xl bg-nx-on-tertiary-container text-nx-primary font-headline font-bold text-sm tracking-wide uppercase hover:scale-[1.02] transition-all duration-200 shadow-lg">
                            <Link href={isSignedIn ? "/billing" : "/register"}>Join Pro Now</Link>
                        </Button>
                    </div>

                    <div className="bg-nx-surface-container-low rounded-3xl p-10 flex flex-col transition-all duration-300 hover:bg-nx-surface-container-high border border-transparent hover:border-nx-surface-variant group">
                        <div className="mb-8">
                            <h2 className="font-headline text-2xl font-bold text-nx-primary mb-1">ENTERPRISE</h2>
                            <p className="text-nx-on-surface-variant text-sm mb-6">Global Scale Solutions</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-headline font-extrabold text-nx-primary">Custom</span>
                            </div>
                            <p className="text-nx-on-surface-variant text-xs mt-2">Billed through sales in USD or INR</p>
                        </div>
                        <ul className="space-y-4 mb-10 flex-grow">
                            {ENTERPRISE_FEATURES.map((f) => (
                                <li key={f} className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-nx-primary text-xl shrink-0 mt-0.5">check_circle</span>
                                    <span className="text-nx-on-surface text-sm">{f}</span>
                                </li>
                            ))}
                        </ul>
                        <Button asChild variant="outline" className="w-full py-6 rounded-xl border-2 border-nx-primary text-nx-primary font-headline font-bold text-sm tracking-wide uppercase hover:bg-nx-primary hover:text-white transition-all duration-200">
                            <Link href="/contact">Contact Sales</Link>
                        </Button>
                    </div>
                </div>
            </section>

            <section className="max-w-6xl mx-auto px-4 md:px-8 pb-24">
                <div className="rounded-3xl overflow-hidden relative min-h-[380px] flex items-center">
                    <div className="absolute inset-0 z-0">
                        <Image
                            src="/assets/images/cta_office.png"
                            alt="Corporate Office"
                            fill
                            className="object-cover grayscale opacity-20"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-nx-primary via-nx-primary/90 to-transparent" />
                    </div>
                    <div className="relative z-10 px-10 md:px-16 max-w-2xl py-16">
                        <h3 className="font-headline text-3xl md:text-4xl font-bold text-white mb-5 leading-snug">
                            Empowering the world&apos;s most innovative organisations.
                        </h3>
                        <p className="text-nx-on-primary-container text-lg mb-8 leading-relaxed">
                            CorpConnect&apos;s AI-powered networking graph helps businesses discover
                            strategic partners, co-host events, and build lasting industry
                            alliances — at any scale.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Button asChild className="px-8 py-6 bg-white text-nx-primary font-headline font-bold rounded-xl hover:bg-nx-surface-container-high transition-colors shadow-lg">
                                <Link href="/events">Explore Events</Link>
                            </Button>
                            <Button asChild variant="outline" className="px-8 py-6 text-white border border-white/30 rounded-xl hover:bg-white/10 transition-colors bg-transparent">
                                <Link href="/organizations/discover">Discover Organisations</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="max-w-4xl mx-auto px-4 md:px-8 pb-28 text-center">
                <p className="text-nx-on-surface-variant text-sm">
                    Every new organisation starts on a <strong className="text-nx-primary">14-day Pro trial</strong>. No credit card
                    required — you drop to the Free plan automatically when it ends. Questions?{" "}
                    <Link href="mailto:hello@corpconnect.io" className="text-nx-on-tertiary-container underline underline-offset-2 hover:opacity-80">
                        hello@corpconnect.io
                    </Link>
                </p>
            </section>
        </div>
    );
}
