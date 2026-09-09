"use client";

import { RouteErrorPanel } from "@/components/route-state/RouteErrorPanel";

export default function AuthError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return <RouteErrorPanel error={error} reset={reset} />;
}
