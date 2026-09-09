"use client";

import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { FileText, Clock, CheckCircle, XCircle, RotateCcw, ChevronRight, MapPin, DollarSign } from "lucide-react";
import Link from "next/link";
import type { SerializedEventPitch, PitchStatus } from "@/domain/pitches";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PitchStatus, { label: string; icon: React.ReactNode; classes: string }> = {
    DRAFT:              { label: "Draft",              icon: <FileText className="w-3.5 h-3.5" />,     classes: "bg-nx-surface-container border-nx-outline-variant text-nx-on-surface-variant" },
    PITCHED:            { label: "Submitted",          icon: <Clock className="w-3.5 h-3.5" />,         classes: "bg-nx-secondary-container border-nx-secondary/20 text-nx-on-secondary-container" },
    IN_REVIEW:          { label: "Under Review",       icon: <Clock className="w-3.5 h-3.5" />,         classes: "bg-nx-warning-container border-nx-warning/20 text-nx-on-warning-container" },
    REVISION_REQUESTED: { label: "Revision Needed",   icon: <RotateCcw className="w-3.5 h-3.5" />,     classes: "bg-nx-warning-container border-nx-warning/40 text-nx-on-warning-container" },
    APPROVED:           { label: "Approved",           icon: <CheckCircle className="w-3.5 h-3.5" />,   classes: "bg-nx-success-container border-nx-success/20 text-nx-on-success-container" },
    REJECTED:           { label: "Not Approved",       icon: <XCircle className="w-3.5 h-3.5" />,       classes: "bg-nx-error-container border-nx-error/20 text-nx-on-error-container" },
};

// ─── MemberPitchCard ──────────────────────────────────────────────────────────

interface MemberPitchCardProps {
    pitch: SerializedEventPitch;
    organizationId: string;
}

export function MemberPitchCard({ pitch, organizationId }: MemberPitchCardProps) {
    const statusCfg = STATUS_CONFIG[pitch.status];
    const updatedAgo = formatDistanceToNow(new Date(pitch.updatedAt), { addSuffix: true });

    return (
        <Link
            href={`/organizations/${organizationId}/pitches/${pitch.id}`}
            className="block group"
        >
            <div className={cn(
                "rounded-2xl border border-nx-outline-variant/30 bg-nx-surface-container-lowest p-5 shadow-nx-card transition-all duration-200",
                "hover:shadow-nx-float hover:-translate-y-0.5",
                pitch.status === "APPROVED" && "border-nx-success/20 bg-nx-success-container/30",
                pitch.status === "REVISION_REQUESTED" && "border-nx-warning/30",
                pitch.status === "REJECTED" && "border-nx-error/20",
            )}>
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        {/* Pitch icon */}
                        <div className="w-10 h-10 rounded-xl bg-nx-primary-container/40 border border-nx-primary/20 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-nx-primary" />
                        </div>
                        <div>
                            <h4 className="font-headline text-sm font-semibold text-nx-on-surface line-clamp-1 group-hover:text-nx-primary transition-colors">
                                {pitch.title}
                            </h4>
                            <p className="font-body text-xs text-nx-on-surface-variant mt-0.5">Updated {updatedAgo}</p>
                        </div>
                    </div>

                    {/* Status badge */}
                    <span className={cn(
                        "shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-label font-semibold",
                        statusCfg.classes
                    )}>
                        {statusCfg.icon}
                        {statusCfg.label}
                    </span>
                </div>

                {/* Description snippet */}
                <p className="font-body text-xs text-nx-on-surface-variant mt-3 line-clamp-2 leading-relaxed">
                    {pitch.description}
                </p>

                {/* Admin notes (revision/rejection feedback) */}
                {pitch.adminNotes && (pitch.status === "REVISION_REQUESTED" || pitch.status === "REJECTED") && (
                    <div className={cn(
                        "mt-3 px-3 py-2.5 rounded-xl border text-xs font-body leading-relaxed",
                        pitch.status === "REVISION_REQUESTED"
                            ? "bg-nx-warning-container border-nx-warning/20 text-nx-on-warning-container"
                            : "bg-nx-error-container border-nx-error/20 text-nx-on-error-container"
                    )}>
                        <span className="font-semibold">Admin note: </span>
                        {pitch.adminNotes}
                    </div>
                )}

                {/* Footer: action hint */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-nx-outline-variant/40">
                    <div className="flex items-center gap-3 text-xs font-body text-nx-on-surface-variant">
                        {pitch.location && (
                            <span className="flex items-center gap-1 min-w-0">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{pitch.location}</span>
                            </span>
                        )}
                        {pitch.estimatedBudget && (
                            <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3 shrink-0" />
                                ${pitch.estimatedBudget.toLocaleString()}
                            </span>
                        )}
                    </div>
                    <span className="text-xs font-label font-medium text-nx-primary flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                        {pitch.status === "DRAFT" ? "Continue editing" : "View details"}
                        <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                </div>
            </div>
        </Link>
    );
}
