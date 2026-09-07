import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-nx-surface-container-low p-4">
            <section className="w-full max-w-lg rounded-2xl border border-nx-outline-variant/30 bg-nx-surface-container-lowest p-8 text-center shadow-nx-card">
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-nx-secondary-container text-nx-on-secondary-container">
                    <SearchX className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="font-label text-xs font-semibold uppercase tracking-[0.14em] text-nx-on-surface-variant">
                    404
                </p>
                <h1 className="mt-2 font-headline text-3xl font-bold text-nx-on-surface">
                    Page not found
                </h1>
                <p className="mt-3 font-body text-sm text-nx-on-surface-variant">
                    The page may have moved, or you may not have access to it.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Button asChild className="rounded-xl">
                        <Link href="/dashboard">Go to dashboard</Link>
                    </Button>
                    <Button asChild variant="outline" className="rounded-xl">
                        <Link href="/">Return home</Link>
                    </Button>
                </div>
            </section>
        </main>
    );
}
