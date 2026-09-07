/**
 * Displays the AI-generated operational milestone checklist for an approved pitch.
 * Tasks are grouped by lifecycle phase (Pre-Event / Event Day / Post-Event).
 * Enterprise-gated — only visible to org members.
 */

import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { checkOrganizationPermission } from "@/domain/organizations";
import { getPitchWithTasks } from "@/domain/pitches";
import { CheckCircle2, Circle, Clock, Users, AlertTriangle, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
    title: "Event Tasklist — CorpConnect",
    description: "Operational milestone checklist generated from your approved event pitch.",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPriorityLabel(priority: number) {
    return priority === 1 ? "High" : priority === 2 ? "Medium" : "Low";
}

/** Maps priority rank onto the Nexus status roles (error / warning / success). */
function getPriorityTone(priority: number) {
    if (priority === 1) return { text: "text-nx-error", dot: "bg-nx-error" };
    if (priority === 2) return { text: "text-nx-warning", dot: "bg-nx-warning" };
    return { text: "text-nx-success", dot: "bg-nx-success" };
}

/**
 * Group tasks by lifecycle phase based on dueDayOffset:
 *   Pre-Event:  offset < 0
 *   Event Day:  offset === 0
 *   Post-Event: offset > 0
 */
function groupTasksByPhase(tasks: TaskItem[]) {
    return {
        preEvent: tasks.filter((t) => t.dueDayOffset < 0).sort((a, b) => a.dueDayOffset - b.dueDayOffset),
        eventDay: tasks.filter((t) => t.dueDayOffset === 0),
        postEvent: tasks.filter((t) => t.dueDayOffset > 0).sort((a, b) => a.dueDayOffset - b.dueDayOffset),
    };
}

type TaskItem = {
    id: string;
    title: string;
    description: string | null;
    dueDayOffset: number;
    priority: number;
    assignedRole: string | null;
    isCompleted: boolean;
};

const META_CHIP = "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-nx-surface-container text-nx-on-surface-variant";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PitchTasksPage({
    params,
}: {
    params: Promise<{ id: string; pitchId: string }>;
}) {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const { id: organizationId, pitchId } = await params;

    // Verify caller is a member of this org
    const { role } = await checkOrganizationPermission(session.user.id, organizationId);
    if (!role) redirect(`/organizations/${organizationId}`);

    const pitch = await getPitchWithTasks(pitchId, organizationId);

    if (!pitch) notFound();

    if (pitch.status !== "APPROVED") {
        return (
            <StatusPanel
                organizationId={organizationId}
                icon={<AlertTriangle className="w-12 h-12 text-nx-warning" />}
                title="Tasklist Not Available"
            >
                The operational tasklist is only generated for approved pitches.
                This pitch is currently in{" "}
                <strong className="font-semibold text-nx-on-surface">{pitch.status}</strong> status.
            </StatusPanel>
        );
    }

    if (pitch.tasks.length === 0) {
        return (
            <StatusPanel
                organizationId={organizationId}
                icon={<Sparkles className="w-12 h-12 text-nx-primary animate-pulse" />}
                title="Generating Your Tasklist…"
            >
                The AI is generating your operational milestone checklist.
                This usually completes within 30 seconds. Refresh the page to check.
            </StatusPanel>
        );
    }

    const grouped = groupTasksByPhase(pitch.tasks);
    const total = pitch.tasks.length;
    const completed = pitch.tasks.filter((t) => t.isCompleted).length;
    const progress = Math.round((completed / total) * 100);

    const phases = [
        { key: "preEvent", label: "Pre-Event Preparation", accent: "border-nx-primary", text: "text-nx-primary", tasks: grouped.preEvent },
        { key: "eventDay", label: "Event Day", accent: "border-nx-warning", text: "text-nx-warning", tasks: grouped.eventDay },
        { key: "postEvent", label: "Post-Event Follow-up", accent: "border-nx-success", text: "text-nx-success", tasks: grouped.postEvent },
    ].filter((p) => p.tasks.length > 0);

    return (
        <div className="min-h-screen bg-nx-surface-container-low py-8 px-4 sm:px-6">
            <div className="max-w-5xl mx-auto flex flex-col gap-8">

                {/* ── Header ── */}
                <div className="flex flex-col gap-5">
                    <Button variant="ghost" size="sm" asChild className="w-fit gap-2 rounded-xl text-nx-on-surface-variant">
                        <Link href={`/organizations/${organizationId}/pitches`}>
                            <ArrowLeft className="w-4 h-4" />
                            Back to Pitches
                        </Link>
                    </Button>

                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                        <div>
                            <h1 className="text-2xl font-headline font-bold tracking-tight text-nx-on-surface flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-nx-primary" />
                                Operational Tasklist
                            </h1>
                            <p className="text-sm text-nx-on-surface-variant mt-1">{pitch.title}</p>
                        </div>

                        <div className="bg-nx-surface-container-lowest rounded-2xl shadow-nx-card p-5 flex flex-col gap-2 w-full sm:w-auto sm:min-w-[220px]">
                            <p className="text-sm text-nx-on-surface-variant">
                                <span className="text-2xl font-bold text-nx-primary">{completed}</span>
                                <span> / </span>
                                <span className="text-lg font-semibold text-nx-on-surface">{total}</span>
                                <span> tasks done</span>
                            </p>
                            <div className="h-1.5 rounded-full bg-nx-surface-container-high overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-nx-primary transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="text-xs text-nx-on-surface-variant">{progress}%</span>
                        </div>
                    </div>
                </div>

                {/* ── Phase Sections ── */}
                <div className="flex flex-col gap-8">
                    {phases.map((phase) => (
                        <div key={phase.key} className="flex flex-col gap-3">
                            <div className={cn("flex items-center justify-between border-l-[3px] pl-3", phase.accent)}>
                                <h2 className={cn("text-base font-headline font-semibold", phase.text)}>
                                    {phase.label}
                                </h2>
                                <span className="text-xs text-nx-on-surface-variant">{phase.tasks.length} tasks</span>
                            </div>

                            <div className="flex flex-col gap-2">
                                {phase.tasks.map((task) => {
                                    const tone = getPriorityTone(task.priority);

                                    return (
                                        <div
                                            key={task.id}
                                            className={cn(
                                                "bg-nx-surface-container-lowest rounded-2xl shadow-nx-card px-4 py-3.5 flex items-start gap-3 transition-colors hover:bg-nx-surface-container",
                                                task.isCompleted && "opacity-60"
                                            )}
                                        >
                                            {/* Completion icon */}
                                            <div className="shrink-0 pt-px">
                                                {task.isCompleted ? (
                                                    <CheckCircle2 className="w-5 h-5 text-nx-success" />
                                                ) : (
                                                    <Circle className="w-5 h-5 text-nx-outline" />
                                                )}
                                            </div>

                                            {/* Task body */}
                                            <div className="flex-1 flex flex-col gap-1.5">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span
                                                        className={cn(
                                                            "text-sm font-medium text-nx-on-surface",
                                                            task.isCompleted && "line-through text-nx-on-surface-variant"
                                                        )}
                                                    >
                                                        {task.title}
                                                    </span>
                                                    <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap", tone.text)}>
                                                        <span className={cn("w-1.5 h-1.5 rounded-full", tone.dot)} />
                                                        {getPriorityLabel(task.priority)}
                                                    </span>
                                                </div>

                                                {task.description && (
                                                    <p className="text-xs leading-relaxed text-nx-on-surface-variant">
                                                        {task.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {task.assignedRole && (
                                                        <span className={META_CHIP}>
                                                            <Users className="w-3 h-3" />
                                                            {task.assignedRole}
                                                        </span>
                                                    )}
                                                    {task.dueDayOffset !== 0 && (
                                                        <span className={META_CHIP}>
                                                            <Clock className="w-3 h-3" />
                                                            {task.dueDayOffset < 0
                                                                ? `${Math.abs(task.dueDayOffset)}d before event`
                                                                : `${task.dueDayOffset}d after event`}
                                                        </span>
                                                    )}
                                                    {task.dueDayOffset === 0 && (
                                                        <span className={cn(META_CHIP, "text-nx-warning")}>
                                                            <Clock className="w-3 h-3" />
                                                            Event day
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPanel({
    organizationId,
    icon,
    title,
    children,
}: {
    organizationId: string;
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-nx-surface-container-low py-8 px-4 sm:px-6 flex items-center justify-center">
            <div className="bg-nx-surface-container-lowest rounded-2xl shadow-nx-card px-8 py-12 max-w-md w-full flex flex-col items-center gap-3 text-center">
                {icon}
                <h1 className="text-xl font-headline font-bold text-nx-on-surface">{title}</h1>
                <p className="text-sm text-nx-on-surface-variant">{children}</p>
                <Button variant="ghost" size="sm" asChild className="mt-2 gap-2 rounded-xl text-nx-primary">
                    <Link href={`/organizations/${organizationId}/pitches`}>
                        <ArrowLeft className="w-4 h-4" />
                        Back to Pitches
                    </Link>
                </Button>
            </div>
        </div>
    );
}
