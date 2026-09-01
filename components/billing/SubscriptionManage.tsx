"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";

interface SubscriptionManageProps {
    provider: "STRIPE" | "RAZORPAY" | string;
}

export function SubscriptionManage({ provider }: SubscriptionManageProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const openStripePortal = () => {
        startTransition(async () => {
            const res = await fetch("/api/billing/portal", { method: "POST" });
            const data = await res.json().catch(() => ({}));
            if (data.url) {
                window.location.href = data.url;
                return;
            }
            toast.error(data.error ?? "Could not open billing portal");
        });
    };

    const cancel = () => {
        if (!confirm("Cancel the active subscription? This stops future renewals.")) return;
        startTransition(async () => {
            const res = await fetch("/api/billing/cancel", { method: "POST" });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(data.error ?? "Could not cancel subscription");
                return;
            }
            toast.success("Subscription cancelled.");
            router.refresh();
        });
    };

    if (provider === "STRIPE") {
        return (
            <button
                type="button"
                onClick={openStripePortal}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-nx-on-tertiary-container border border-nx-outline-variant/40 hover:bg-nx-surface-container-high transition-colors"
            >
                <CreditCard className="w-4 h-4" />
                {isPending ? "Opening…" : "Manage billing via Stripe"}
            </button>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            <p className="text-xs text-nx-on-surface-variant">
                Razorpay has no hosted portal. Cancel here, then subscribe again to change plan or interval.
            </p>
            <button
                type="button"
                onClick={cancel}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-nx-error border border-nx-outline-variant/40 hover:bg-nx-surface-container-high transition-colors w-fit"
            >
                {isPending ? "Cancelling…" : "Cancel subscription"}
            </button>
        </div>
    );
}
