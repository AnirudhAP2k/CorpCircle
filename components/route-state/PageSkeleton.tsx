import { Skeleton } from "@/components/ui/skeleton";

export function ProtectedPageSkeleton() {
    return (
        <div className="wrapper py-8" aria-label="Loading page">
            <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-3">
                    <Skeleton className="h-8 w-52 rounded-xl bg-nx-surface-container-high" />
                    <Skeleton className="h-4 w-72 max-w-full rounded-lg bg-nx-surface-container-high" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="rounded-2xl border border-nx-outline-variant/30 bg-nx-surface-container-lowest p-5 shadow-nx-card"
                        >
                            <Skeleton className="mb-4 h-10 w-10 rounded-xl bg-nx-surface-container-high" />
                            <Skeleton className="mb-2 h-7 w-20 rounded-lg bg-nx-surface-container-high" />
                            <Skeleton className="h-4 w-32 rounded-lg bg-nx-surface-container-high" />
                        </div>
                    ))}
                </div>
                <div className="rounded-2xl border border-nx-outline-variant/30 bg-nx-surface-container-lowest p-6 shadow-nx-card">
                    <Skeleton className="mb-6 h-6 w-44 rounded-lg bg-nx-surface-container-high" />
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <Skeleton key={index} className="h-16 w-full rounded-xl bg-nx-surface-container-high" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function AuthPageSkeleton() {
    return (
        <div
            className="w-full max-w-[440px] rounded-2xl border border-nx-outline-variant/30 bg-nx-surface-container-lowest/95 p-6 shadow-nx-float"
            aria-label="Loading authentication form"
        >
            <Skeleton className="mx-auto mb-3 h-8 w-48 rounded-lg bg-nx-surface-container-high" />
            <Skeleton className="mx-auto mb-8 h-4 w-64 max-w-full rounded-lg bg-nx-surface-container-high" />
            <div className="space-y-5">
                <Skeleton className="h-11 w-full rounded-xl bg-nx-surface-container-high" />
                <Skeleton className="h-11 w-full rounded-xl bg-nx-surface-container-high" />
                <Skeleton className="h-11 w-full rounded-xl bg-nx-primary/20" />
            </div>
        </div>
    );
}
