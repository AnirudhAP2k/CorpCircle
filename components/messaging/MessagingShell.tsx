"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MessagingShell({
    sidebar,
    children,
}: {
    sidebar: ReactNode;
    children: ReactNode;
}) {
    const pathname = usePathname();
    const isConversationOpen = pathname !== "/messaging" && pathname !== "/messaging/";

    return (
        <div className="flex h-full overflow-hidden">
            <div className={cn("h-full w-full md:block md:w-auto", isConversationOpen && "hidden md:block")}>
                {sidebar}
            </div>
            <div className={cn("h-full min-w-0 flex-1", !isConversationOpen && "hidden md:block")}>
                {children}
            </div>
        </div>
    );
}
