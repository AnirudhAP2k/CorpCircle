/**
 * app/(protected)/events/[id]/payment-success/page.tsx
 *
 * Stripe redirects here after a successful checkout.
 * URL: /events/[id]/payment-success?session_id=cs_...
 *
 * Responsibilities:
 *  1. Verify the Stripe session is actually paid (server-side, never trust the URL alone).
 *  2. Optimistically confirm the EventParticipation + EventPayment in DB
 *     (the webhook will also fire — the upsert / updateMany guards against double-writes).
 *  3. Render a polished success screen with event details + CTA.
 */

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { confirmPaidParticipation } from "@/domain/billing";
import { getEventSummary } from "@/domain/events";
import { getStripe } from "@/lib/payment/stripe";
import Link from "next/link";
import { CheckCircle2, Calendar, ArrowRight, Home, MapPin } from "lucide-react";

interface Props {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ session_id?: string }>;
}

export default async function PaymentSuccessPage({ params, searchParams }: Props) {
    const { id: eventId } = await params;
    const { session_id } = await searchParams;

    const session = await auth();
    if (!session?.user?.id) redirect(`/events/${eventId}`);

    // ── 1. Verify the Stripe session ──────────────────────────────────────────
    if (!session_id) redirect(`/events/${eventId}`);

    let stripeSession: any;
    try {
        const stripe = getStripe();
        stripeSession = await stripe.checkout.sessions.retrieve(session_id, {
            expand: ["payment_intent"],
        });
    } catch {
        redirect(`/events/${eventId}`);
    }

    // Extra safety — must be paid
    if (stripeSession.payment_status !== "paid") {
        redirect(`/events/${eventId}`);
    }

    const participationId = stripeSession.metadata?.participationId as string | undefined;
    const userId = stripeSession.metadata?.userId as string | undefined;

    // ── 2. Optimistic DB confirmation (webhook may arrive later) ───────────────
    if (participationId && userId === session.user.id) {
        const pi = stripeSession.payment_intent;
        const receiptUrl =
            typeof pi === "object"
                ? (pi as any)?.charges?.data?.[0]?.receipt_url ?? null
                : null;

        await confirmPaidParticipation({
            participationId,
            paymentIntentId: typeof pi === "string" ? pi : pi?.id ?? null,
            receiptUrl,
        });
    }

    // ── 3. Load event details for the success screen ──────────────────────────
    const event = await getEventSummary(eventId);

    if (!event) redirect("/events");

    const formattedDate = new Intl.DateTimeFormat("en-IN", {
        dateStyle: "full",
        timeStyle: "short",
    }).format(new Date(event.startDateTime));

    return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-nx-surface-container-low p-4 sm:p-6">
            <div className="w-full min-w-0 max-w-lg">
                <div className="overflow-hidden rounded-2xl border border-nx-outline-variant/30 bg-nx-surface-container-lowest shadow-nx-card">
                    <div className="h-2 bg-nx-primary" />

                    <div className="p-5 text-center sm:p-8">
                        <div className="mb-6 flex justify-center">
                            <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-nx-success-container">
                                <CheckCircle2
                                    className="relative z-10 h-12 w-12 text-nx-success"
                                    strokeWidth={1.5}
                                    aria-hidden="true"
                                />
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-nx-success/30" />
                            </span>
                        </div>

                        <h1 className="mb-2 font-headline text-xl font-bold tracking-tight text-nx-on-surface sm:text-2xl">
                            You&apos;re registered!
                        </h1>
                        <p className="mb-8 font-body text-sm text-nx-on-surface-variant">
                            Payment confirmed. Your spot has been secured for this event.
                        </p>

                        <div className="mb-8 space-y-3 rounded-2xl bg-nx-surface-container-low p-4 text-left sm:p-5">
                            <h2 className="break-words font-headline text-base font-semibold leading-snug text-nx-on-surface">
                                {event.title}
                            </h2>
                            {event.organization && (
                                <p className="break-words font-label text-xs font-medium text-nx-on-tertiary-container">
                                    Hosted by {event.organization.name}
                                </p>
                            )}
                            <div className="flex items-start gap-2 font-body text-sm text-nx-on-surface-variant">
                                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-nx-on-surface-variant/70" aria-hidden="true" />
                                <span className="min-w-0 break-words">{formattedDate}</span>
                            </div>
                            <div className="flex items-start gap-2 font-body text-sm text-nx-on-surface-variant">
                                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-nx-on-surface-variant/70" aria-hidden="true" />
                                <span className="min-w-0 break-words">{event.location}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Link
                                href={`/events/${eventId}`}
                                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-nx-outline-variant/40 px-4 py-3 text-sm font-medium text-nx-on-surface transition-colors hover:bg-nx-surface-container-low"
                            >
                                <Home className="h-4 w-4 shrink-0" aria-hidden="true" />
                                Event Page
                            </Link>
                            <Link
                                href="/events"
                                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-nx-primary px-4 py-3 text-sm font-medium text-nx-on-primary transition-opacity hover:opacity-90"
                            >
                                Explore Events
                                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                            </Link>
                        </div>
                    </div>
                </div>

                <p className="mt-4 px-2 text-center font-body text-xs text-nx-on-surface-variant/70">
                    A receipt has been sent to your email address.
                </p>
            </div>
        </div>
    );
}
