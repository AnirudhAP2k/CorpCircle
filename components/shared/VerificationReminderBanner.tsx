"use client";

import Link from "next/link";
import { ShieldAlert, ArrowRight, X } from "lucide-react";
import { useState } from "react";

interface VerificationReminderBannerProps {
    orgId: string;
    orgName: string;
    /** Current meta status */
    status: "PENDING" | "AWAITING_DOCS" | "IN_REVIEW" | "REJECTED" | "VERIFIED";
}

const CONFIG = {
    AWAITING_DOCS: {
        bg: "border-nx-warning/20 bg-nx-warning-container",
        icon: "text-nx-warning",
        text: "text-nx-on-warning-container",
        sub: "text-nx-on-warning-container/80",
        badge: "bg-nx-warning text-nx-on-warning",
        title: (name: string) => `Complete verification for ${name}`,
        body: "Your organization passed initial safety checks! Upload required KYB documents to host events and use matchmaking.",
        cta: "Complete Verification",
    },
    PENDING: {
        bg: "border-nx-outline-variant/40 bg-nx-surface-container-low",
        icon: "text-nx-on-surface-variant",
        text: "text-nx-on-surface",
        sub: "text-nx-on-surface-variant",
        badge: "bg-nx-surface-container-highest text-nx-on-surface",
        title: (name: string) => `Complete verification for ${name}`,
        body: "Your organization is pending verification. Please wait for our system to review the first phase of verification. We will notify you once it is completed.",
        cta: "Check Status",
    },
    IN_REVIEW: {
        bg: "border-nx-secondary/20 bg-nx-secondary-container",
        icon: "text-nx-secondary",
        text: "text-nx-on-secondary-container",
        sub: "text-nx-on-secondary-container/80",
        badge: "bg-nx-secondary text-nx-on-secondary",
        title: (name: string) => `${name} is under review`,
        body: "Your KYB documents are being reviewed by our team. This usually takes 1–2 business days. Core features are locked until manual approval.",
        cta: "View Status",
    },
    REJECTED: {
        bg: "border-nx-error/20 bg-nx-error-container",
        icon: "text-nx-error",
        text: "text-nx-on-error-container",
        sub: "text-nx-on-error-container/80",
        badge: "bg-nx-error text-nx-on-error",
        title: (name: string) => `${name} verification was rejected`,
        body: "Your verification was rejected. Please review the admin notes and resubmit with updated information and documents.",
        cta: "Resubmit Documents",
    },
    VERIFIED: null, // Don't render
};

export function VerificationReminderBanner({ orgId, orgName, status }: VerificationReminderBannerProps) {
    const [dismissed, setDismissed] = useState(false);
    const cfg = CONFIG[status];

    if (!cfg || dismissed) return null;

    return (
        <div className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-start sm:gap-4 ${cfg.bg}`}>
            {/* Icon */}
            <ShieldAlert className={`h-5 w-5 flex-shrink-0 mt-0.5 ${cfg.icon}`} />

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className={`font-headline text-sm font-semibold ${cfg.text}`}>
                        {cfg.title(orgName)}
                    </p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.badge}`}>
                        {status.replace("_", " ")}
                    </span>
                </div>
                <p className={`text-xs ${cfg.sub} leading-relaxed`}>{cfg.body}</p>
            </div>

            {/* CTA */}
            <div className="flex flex-shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                <Link href={`/organizations/${orgId}/complete-verification`}>
                    <button
                        id={`verify-banner-cta-${orgId}`}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors
                            ${status === "REJECTED"
                                ? "border-nx-error bg-nx-error text-nx-on-error hover:bg-nx-error/90"
                                : status === "IN_REVIEW"
                                    ? "border-nx-secondary bg-nx-secondary text-nx-on-secondary hover:bg-nx-secondary/90"
                                    : "border-nx-warning bg-nx-warning text-nx-on-warning hover:bg-nx-warning/90"
                            }`}
                    >
                        {cfg.cta}
                        <ArrowRight className="h-3 w-3" />
                    </button>
                </Link>
                {status !== "IN_REVIEW" && (
                    <button
                        onClick={() => setDismissed(true)}
                        className="rounded-xl p-1 text-nx-on-surface-variant transition-colors hover:bg-nx-surface-container-high hover:text-nx-on-surface"
                        title="Dismiss"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
