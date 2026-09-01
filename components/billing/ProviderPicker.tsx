"use client";

/**
 * components/billing/ProviderPicker.tsx
 *
 * Full-screen fixed modal for selecting a payment provider (Stripe / Razorpay).
 * Calls /api/events/[id]/checkout and handles the redirect.
 */

import { useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";

import { formatMajorAmount } from "@/lib/money";

function loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if ((window as any).Razorpay) return resolve();
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
        document.head.appendChild(script);
    });
}

interface ProviderPickerProps {
    eventId: string;
    eventTitle: string;
    price: string;
    currency: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export function ProviderPicker({
    eventId,
    eventTitle,
    price,
    currency,
    onClose,
    onSuccess,
}: ProviderPickerProps) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const gateway = currency.toUpperCase() === "INR" ? "razorpay" : "stripe";

    const pay = () => {
        setError(null);
        startTransition(async () => {
            try {
                const res = await fetch(`/api/events/${eventId}/checkout`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ provider: gateway }),
                });
                const data = await res.json();

                if (!res.ok) {
                    setError(data.error ?? "Checkout failed. Please try again.");
                    return;
                }

                if (data.mode === "free") {
                    onSuccess?.();
                    onClose();
                    return;
                }

                if (data.mode === "external") {
                    window.open(data.url, "_blank");
                    onClose();
                    return;
                }

                if (data.url) {
                    // Stripe redirect
                    window.location.href = data.url;
                    return;
                }

                // Razorpay — load browser SDK from CDN then open inline checkout
                if (data.orderId && typeof window !== "undefined") {
                    await loadRazorpayScript();
                    const rzp = new (window as any).Razorpay({
                        key: data.keyId,
                        amount: data.amount,
                        currency: data.currency,
                        name: "CorpConnect",
                        description: data.eventTitle,
                        order_id: data.orderId,
                        callback_url: data.callbackUrl,
                        prefill: data.prefill,
                        theme: { color: "#6366f1" },
                    });
                    rzp.open();
                    onClose();
                }
            } catch (error: any) {
                console.error(error);
                setError(error.message || "Something went wrong. Please try again.");
            }
        });
    };

    return (
        // Fixed full-screen backdrop
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            {/* Modal card */}
            <div
                className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl p-8 flex flex-col gap-5"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="provider-picker-title"
            >
                {/* Close button */}
                <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
                    onClick={onClose}
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="text-4xl">💳</div>
                    <h2 id="provider-picker-title" className="text-xl font-bold text-gray-900">
                        Complete Your Registration
                    </h2>
                    <p className="text-sm text-gray-500">
                        <span className="font-semibold text-gray-800">{eventTitle}</span>
                        {" — "}
                        <span className="font-semibold text-indigo-600">
                            {formatMajorAmount(price, currency)}
                        </span>
                    </p>
                </div>

                <p className="text-sm text-gray-600 text-center">
                    {gateway === "razorpay"
                        ? "Pay with Razorpay (UPI, cards, net banking)"
                        : "Pay with Stripe (cards, Apple Pay)"}
                </p>

                <button
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 p-4 transition-all disabled:opacity-50 font-semibold text-gray-900"
                    onClick={pay}
                    disabled={isPending}
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isPending ? "Preparing checkout…" : `Continue with ${gateway === "razorpay" ? "Razorpay" : "Stripe"}`}
                </button>

                {/* Error */}
                {error && (
                    <p className="text-sm text-red-600 text-center bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                {/* Pending state */}
                {isPending && (
                    <p className="text-sm text-indigo-600 text-center animate-pulse">Preparing checkout…</p>
                )}

                {/* Security note */}
                <p className="text-xs text-gray-400 text-center">
                    🔒 Payments secured by Stripe / Razorpay. CorpConnect never stores card details.
                </p>
            </div>
        </div>
    );
}
