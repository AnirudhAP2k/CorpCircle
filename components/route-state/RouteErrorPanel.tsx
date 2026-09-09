"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RouteErrorPanelProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export function RouteErrorPanel({ error, reset }: RouteErrorPanelProps) {
    useEffect(() => {
        Sentry.captureException(error);
    }, [error]);

    return (
        <div className="flex min-h-[50vh] items-center justify-center p-4">
            <section className="w-full max-w-lg rounded-2xl border border-nx-error/20 bg-nx-surface-container-lowest p-8 text-center shadow-nx-card">
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-nx-error-container text-nx-on-error-container">
                    <AlertTriangle className="h-6 w-6" aria-hidden="true" />
                </div>
                <h1 className="font-headline text-2xl font-bold text-nx-on-surface">
                    We couldn&apos;t load this page
                </h1>
                <p className="mt-2 font-body text-sm text-nx-on-surface-variant">
                    Please try again. If the problem continues, share reference{" "}
                    <span className="font-mono">{error.digest ?? "unavailable"}</span> with support.
                </p>
                <Button onClick={reset} className="mt-6 rounded-xl">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Try again
                </Button>
            </section>
        </div>
    );
}
