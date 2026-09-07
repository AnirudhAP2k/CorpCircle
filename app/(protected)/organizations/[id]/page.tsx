import { auth } from "@/auth";
import { getConnectionBetweenOrgs, getOrganizationProfile } from "@/domain/organizations";
import { getPublicUserById } from "@/domain/users";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    Edit, Users, Calendar, ExternalLink, Linkedin, Twitter,
    Briefcase, Code2, Handshake, CheckCircle, Building2, MapPin,
    Globe, Target, Search, Banknote, Megaphone, type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import MemberCard from "@/components/shared/MemberCard";
import ConnectButton from "@/components/organizations/ConnectButton";
import { StartConversationButton } from "@/components/messaging/StartConversationButton";
import { VerificationReminderBanner } from "@/components/shared/VerificationReminderBanner";

// ISR — org profile is semi-static, revalidate every 60 s
export const revalidate = 60;

interface OrganizationProfilePageProps {
    params: Promise<{ id: string }>;
}

const SIZE_LABELS: Record<string, string> = {
    STARTUP: "Startup",
    SME: "SME",
    ENTERPRISE: "Enterprise",
};

const INTENT_BADGES: Record<string, { label: string; icon: LucideIcon; className: string }> = {
    GENERAL_NETWORKING: {
        label: "General Networking",
        icon: Globe,
        className: "bg-nx-surface-container-high text-nx-on-surface-variant border-nx-outline-variant",
    },
    OPEN_TO_PARTNERSHIPS: {
        label: "Open to Partnerships",
        icon: Handshake,
        className: "bg-nx-secondary-container text-nx-on-secondary-container border-nx-secondary/20",
    },
    SEEKING_CLIENTS: {
        label: "Seeking Clients",
        icon: Target,
        className: "bg-nx-success-container text-nx-on-success-container border-nx-success/20",
    },
    SEEKING_VENDORS: {
        label: "Seeking Vendors",
        icon: Search,
        className: "bg-nx-primary-fixed text-nx-on-primary-fixed border-nx-primary/20",
    },
    SEEKING_INVESTMENT: {
        label: "Seeking Investment",
        icon: Banknote,
        className: "bg-nx-warning-container text-nx-on-warning-container border-nx-warning/20",
    },
    SPONSORING_EVENTS: {
        label: "Sponsoring Events",
        icon: Megaphone,
        className: "bg-nx-tertiary-container text-nx-on-tertiary-container border-nx-tertiary/20",
    },
};

// ─── Networking intent chip ────────────────────────────────────────────────────
const IntentChip = ({ intent, className = "" }: { intent: string; className?: string }) => {
    const badge = INTENT_BADGES[intent] ?? INTENT_BADGES.GENERAL_NETWORKING;
    const Icon = badge.icon;
    return (
        <span
            className={`inline-flex min-w-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${badge.className} ${className}`}
        >
            <Icon className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{badge.label}</span>
        </span>
    );
};

// ─── Small chip array component ────────────────────────────────────────────────
const ChipList = ({ items, colorClass = "bg-nx-secondary-container/60 text-nx-on-secondary-container border-nx-secondary/20" }: {
    items: string[];
    colorClass?: string;
}) => {
    if (!items || items.length === 0) return <p className="text-sm italic text-nx-on-surface-variant/70">None listed</p>;
    return (
        <div className="flex flex-wrap gap-2">
            {items.map((item) => (
                <span key={item} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
                    {item}
                </span>
            ))}
        </div>
    );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
const OrganizationProfilePage = async ({ params }: OrganizationProfilePageProps) => {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) redirect("/login");

    // Fetch org directly from DB — no unnecessary HTTP round-trip
    const organization = await getOrganizationProfile(id);

    if (!organization) notFound();

    const org = organization as typeof organization & {
        networkingIntent: string;
        services: string[];
        technologies: string[];
        partnershipInterests: string[];
        linkedinUrl: string | null;
        twitterUrl: string | null;
    };

    const currentUserMembership = org.members.find((m) => m.userId === userId);
    const canEdit = currentUserMembership && ["OWNER", "ADMIN"].includes(currentUserMembership.role);
    const canManageMembers = currentUserMembership?.role === "OWNER";
    const isMember = !!currentUserMembership;

    const networkingIntent = org.networkingIntent;

    // Resolve connection status for ConnectButton (only for non-members)
    let connectionStatus: "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "ACCEPTED" | "DECLINED" | "WITHDRAWN" | "NO_ACTIVE_ORG" = "NO_ACTIVE_ORG";
    let connectionId: string | undefined;
    let activeOrgIdForButton: string | null = null;

    if (!isMember) {
        const user = await getPublicUserById(userId);
        activeOrgIdForButton = user?.activeOrganizationId ?? null;

        if (activeOrgIdForButton) {
            const conn = await getConnectionBetweenOrgs(activeOrgIdForButton, id);

            if (!conn) {
                connectionStatus = "NONE";
            } else if (conn.status === "ACCEPTED") {
                connectionStatus = "ACCEPTED";
            } else if (conn.status === "PENDING") {
                connectionStatus = conn.sourceOrgId === activeOrgIdForButton ? "PENDING_SENT" : "PENDING_RECEIVED";
            } else if (conn.status === "DECLINED") {
                connectionStatus = "DECLINED";
            } else {
                connectionStatus = "WITHDRAWN";
            }
            connectionId = conn?.id;
        }
    }

    return (
        <div className="min-h-screen bg-nx-background">
            {/* Verification banner — only shown to OWNER/ADMIN when org is not yet verified */}
            {canEdit && (() => {
                const verificationStatus = org.meta?.verificationStatus ?? "PENDING";
                const showBanner = verificationStatus !== "VERIFIED";
                if (!showBanner) return null;
                return (
                    <div className="wrapper pt-4">
                        <VerificationReminderBanner
                            orgId={org.id}
                            orgName={org.name}
                            status={verificationStatus}
                        />
                    </div>
                );
            })()}

            {/* Hero / header band */}
            <div className="bg-nx-surface-container-lowest border-b border-nx-outline-variant/60">
                <div className="wrapper py-6 sm:py-8">
                    <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">

                        {/* Logo */}
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-2xl overflow-hidden bg-nx-surface-container-high border border-nx-outline-variant/60 shadow-nx-card">
                            {organization.logo ? (
                                <Image
                                    src={organization.logo}
                                    alt={organization.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 640px) 64px, 80px"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-nx-on-surface-variant/40" />
                                </div>
                            )}
                        </div>

                        {/* Name + meta */}
                        <div className="flex-1 min-w-0 w-full">
                            <div className="flex items-center gap-2 flex-wrap mb-1 min-w-0">
                                <h1 className="font-headline text-xl sm:text-2xl font-bold text-nx-on-surface break-words">
                                    {organization.name}
                                </h1>
                                {organization.isVerified && (
                                    <CheckCircle className="w-5 h-5 text-nx-primary flex-shrink-0" aria-label="Verified organization" />
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-nx-on-surface-variant mb-3 min-w-0">
                                <span className="truncate max-w-full">{organization.industry.label}</span>
                                {organization.size && (
                                    <Badge variant="outline" className="text-xs border-nx-outline-variant text-nx-on-surface-variant">
                                        {SIZE_LABELS[organization.size]}
                                    </Badge>
                                )}
                                {organization.location && (
                                    <span className="flex min-w-0 items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span className="truncate">{organization.location}</span>
                                    </span>
                                )}
                                <IntentChip intent={networkingIntent} className="max-w-full" />
                            </div>

                            {/* Social / web links */}
                            <div className="flex items-center gap-x-3 gap-y-2 flex-wrap min-w-0">
                                {organization.website && (
                                    <a href={organization.website} target="_blank" rel="noopener noreferrer"
                                        className="flex min-w-0 max-w-full items-center gap-1.5 text-sm text-nx-on-surface-variant hover:text-nx-primary transition-colors">
                                        <ExternalLink className="w-4 h-4 flex-shrink-0" />
                                        <span className="truncate">{organization.website.replace(/^https?:\/\//, "")}</span>
                                    </a>
                                )}
                                {(organization as any).linkedinUrl && (
                                    <a href={(organization as any).linkedinUrl} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-sm text-nx-on-surface-variant hover:text-nx-primary transition-colors">
                                        <Linkedin className="w-4 h-4 flex-shrink-0" />LinkedIn
                                    </a>
                                )}
                                {(organization as any).twitterUrl && (
                                    <a href={(organization as any).twitterUrl} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-sm text-nx-on-surface-variant hover:text-nx-primary transition-colors">
                                        <Twitter className="w-4 h-4 flex-shrink-0" />Twitter / X
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex w-full md:w-auto items-center gap-2 flex-wrap md:flex-shrink-0">
                            {/* Connect button — shown to non-members only */}
                            {!isMember && (
                                <ConnectButton
                                    targetOrgId={id}
                                    targetOrgName={organization.name}
                                    activeOrgId={activeOrgIdForButton ?? null}
                                    initialStatus={connectionStatus}
                                    connectionId={connectionId}
                                />
                            )}
                            {/* Message button — only when already connected */}
                            {!isMember && connectionStatus === "ACCEPTED" && (
                                <StartConversationButton
                                    targetOrgId={id}
                                    targetOrgName={organization.name}
                                />
                            )}
                            {canEdit && (
                                <Link href={`/organizations/${id}/edit`}>
                                    <Button variant="outline" className="gap-2">
                                        <Edit className="w-4 h-4" />Edit
                                    </Button>
                                </Link>
                            )}
                            {canManageMembers && (
                                <Link href={`/organizations/${id}/members`}>
                                    <Button className="gap-2">
                                        <Users className="w-4 h-4" />Manage Members
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Body grid */}
            <div className="wrapper py-6 sm:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left column */}
                    <div className="space-y-6 lg:col-span-2 min-w-0">

                        {/* About */}
                        <Card className="rounded-2xl border-nx-outline-variant/60 bg-nx-surface-container-lowest shadow-nx-card">
                            <CardHeader><CardTitle className="font-headline text-nx-on-surface">About</CardTitle></CardHeader>
                            <CardContent>
                                {organization.description
                                    ? <p className="text-nx-on-surface-variant leading-relaxed break-words">{organization.description}</p>
                                    : <p className="italic text-nx-on-surface-variant/70">No description provided</p>
                                }
                                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-nx-on-surface-variant mt-4 pt-4 border-t border-nx-outline-variant/60">
                                    <span><strong className="text-nx-on-surface">{organization._count.members}</strong> Members</span>
                                    <span><strong className="text-nx-on-surface">{organization._count.events}</strong> Events Hosted</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Services */}
                        <Card className="rounded-2xl border-nx-outline-variant/60 bg-nx-surface-container-lowest shadow-nx-card">
                            <CardHeader>
                                <CardTitle className="font-headline flex items-center gap-2 text-nx-on-surface">
                                    <Briefcase className="w-4 h-4 text-nx-on-surface-variant" />Services Offered
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ChipList items={(organization as any).services ?? []} />
                            </CardContent>
                        </Card>

                        {/* Technologies */}
                        <Card className="rounded-2xl border-nx-outline-variant/60 bg-nx-surface-container-lowest shadow-nx-card">
                            <CardHeader>
                                <CardTitle className="font-headline flex items-center gap-2 text-nx-on-surface">
                                    <Code2 className="w-4 h-4 text-nx-on-surface-variant" />Technologies
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ChipList
                                    items={(organization as any).technologies ?? []}
                                    colorClass="bg-nx-primary-fixed text-nx-on-primary-fixed border-nx-primary/20"
                                />
                            </CardContent>
                        </Card>

                        {/* Partnership Interests */}
                        <Card className="rounded-2xl border-nx-outline-variant/60 bg-nx-surface-container-lowest shadow-nx-card">
                            <CardHeader>
                                <CardTitle className="font-headline flex items-center gap-2 text-nx-on-surface">
                                    <Handshake className="w-4 h-4 text-nx-on-surface-variant" />Partnership Interests
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ChipList
                                    items={(organization as any).partnershipInterests ?? []}
                                    colorClass="bg-nx-warning-container text-nx-on-warning-container border-nx-warning/20"
                                />
                            </CardContent>
                        </Card>

                        {/* Tags */}
                        {organization.orgTags.length > 0 && (
                            <Card className="rounded-2xl border-nx-outline-variant/60 bg-nx-surface-container-lowest shadow-nx-card">
                                <CardHeader><CardTitle className="font-headline text-nx-on-surface">Tags</CardTitle></CardHeader>
                                <CardContent>
                                    <ChipList
                                        items={organization.orgTags.map((t) => t.tag.label)}
                                        colorClass="bg-nx-surface-container-high text-nx-on-surface-variant border-nx-outline-variant"
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* Hosted Events */}
                        <Card className="rounded-2xl border-nx-outline-variant/60 bg-nx-surface-container-lowest shadow-nx-card">
                            <CardHeader>
                                <CardTitle className="font-headline text-nx-on-surface">Hosted Events ({organization._count.events})</CardTitle>
                                <CardDescription>Events organized by this organization</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {organization.events.length > 0 ? (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {organization.events.map((event) => (
                                            <Link
                                                key={event.id}
                                                href={`/events/${event.id}`}
                                                className="block overflow-hidden rounded-2xl border border-nx-outline-variant/60 bg-nx-surface-container-lowest transition-shadow hover:shadow-nx-float"
                                            >
                                                {event.image && (
                                                    <div className="relative h-36 w-full bg-nx-surface-container-high">
                                                        <Image src={event.image} alt={event.title} fill className="object-cover" sizes="(max-width:768px) 100vw, 50vw" />
                                                    </div>
                                                )}
                                                <div className="p-4">
                                                    <h3 className="font-headline font-semibold text-nx-on-surface mb-1 truncate">{event.title}</h3>
                                                    <div className="flex items-center gap-1.5 mt-1 text-xs text-nx-on-surface-variant">
                                                        <Calendar className="w-3 h-3 flex-shrink-0" />
                                                        {new Date(event.startDateTime).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Calendar className="w-10 h-10 text-nx-on-surface-variant/40 mx-auto mb-3" />
                                        <p className="text-nx-on-surface-variant">No events hosted yet</p>
                                        {canEdit && (
                                            <Link href="/events/create">
                                                <Button className="mt-4" size="sm">Create First Event</Button>
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right column */}
                    <div className="space-y-6 min-w-0">
                        {/* Members */}
                        <Card className="rounded-2xl border-nx-outline-variant/60 bg-nx-surface-container-lowest shadow-nx-card">
                            <CardHeader>
                                <CardTitle className="font-headline text-nx-on-surface">Members ({organization._count.members})</CardTitle>
                                <CardDescription>People in this organization</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {organization.members.slice(0, 6).map((member) => (
                                        <MemberCard key={member.id} member={member} showActions={false} />
                                    ))}
                                    {organization._count.members > 6 && (
                                        <div className="text-center pt-3">
                                            <Link href={`/organizations/${id}/members`}>
                                                <Button variant="outline" size="sm">
                                                    View All {organization._count.members} Members
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick stats */}
                        <Card className="rounded-2xl border-nx-outline-variant/60 bg-nx-surface-container-lowest shadow-nx-card">
                            <CardHeader><CardTitle className="font-headline text-nx-on-surface">At a Glance</CardTitle></CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-center justify-between gap-3 text-nx-on-surface-variant">
                                    <span className="flex-shrink-0">Industry</span>
                                    <span className="min-w-0 text-right font-medium text-nx-on-surface break-words">{organization.industry.label}</span>
                                </div>
                                {organization.size && (
                                    <div className="flex items-center justify-between gap-3 text-nx-on-surface-variant">
                                        <span className="flex-shrink-0">Size</span>
                                        <span className="min-w-0 text-right font-medium text-nx-on-surface break-words">{SIZE_LABELS[organization.size]}</span>
                                    </div>
                                )}
                                {organization.location && (
                                    <div className="flex items-center justify-between gap-3 text-nx-on-surface-variant">
                                        <span className="flex-shrink-0">Location</span>
                                        <span className="min-w-0 text-right font-medium text-nx-on-surface break-words">{organization.location}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-3 text-nx-on-surface-variant">
                                    <span className="flex-shrink-0">Intent</span>
                                    <IntentChip intent={networkingIntent} />
                                </div>
                                <div className="flex items-center justify-between gap-3 text-nx-on-surface-variant">
                                    <span className="flex-shrink-0">Verified</span>
                                    {organization.isVerified ? (
                                        <span className="flex items-center gap-1 font-medium text-nx-on-surface">
                                            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 text-nx-primary" aria-hidden="true" />Yes
                                        </span>
                                    ) : (
                                        <span className="font-medium text-nx-on-surface">—</span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between gap-3 text-nx-on-surface-variant">
                                    <span className="flex-shrink-0">Member since</span>
                                    <span className="min-w-0 text-right font-medium text-nx-on-surface">
                                        {new Date(organization.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizationProfilePage;
