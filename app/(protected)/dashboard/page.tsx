import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Building2, Calendar, TrendingUp, Zap, Star, ArrowRight, Sparkles, MessageCircle, PenTool, Bot, Shield } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import EventRow from "@/components/dashboard/EventRow";
import { getUserDashboardStats, getRecommendedEvents } from "@/data/dashboard";
import { getUserOrganizations } from "@/data/organization";
import { getDashboardUser } from "@/domain/users";
import { getUnverifiedOrgsForAdmin } from "@/domain/organizations";
import { VerificationReminderBanner } from "@/components/shared/VerificationReminderBanner";
import Image from "next/image";

const DashboardPage = async () => {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) redirect("/login");

    const user = await getDashboardUser(userId);

    const [stats, orgs, recommendedEvents, unverifiedOrgBanners] = await Promise.all([
        getUserDashboardStats(userId),
        getUserOrganizations(userId),
        getRecommendedEvents(userId, user?.industryId),
        getUnverifiedOrgsForAdmin(userId),
    ]);

    return (
        <div className="wrapper py-6 font-body text-nx-on-surface sm:py-8">
            <div className="flex flex-col gap-8">
                {/* Verification Reminder Banners */}
                {unverifiedOrgBanners.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {unverifiedOrgBanners.map((o) => (
                            <VerificationReminderBanner
                                key={o.id}
                                orgId={o.id}
                                orgName={o.name}
                                status={(o.meta?.verificationStatus ?? "PENDING") as Parameters<typeof VerificationReminderBanner>[0]["status"]}
                            />
                        ))}
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="font-headline text-3xl font-bold text-nx-on-surface">Dashboard</h1>
                        <p className="mt-2 font-body text-nx-on-surface-variant">
                            Welcome back, {session.user.name}!
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {user?.isAppAdmin && (
                            <Link href="/admin/dashboard">
                                <Button variant="outline" size="sm" className="rounded-xl border-nx-outline-variant/40">
                                    <Shield className="mr-1 h-4 w-4" /> Admin Console
                                </Button>
                            </Link>
                        )}
                        <Link href="/events/create">
                            <Button className="rounded-xl bg-nx-primary text-nx-on-primary hover:bg-nx-primary/90">
                                <Calendar className="mr-2 h-4 w-4" />
                                Create Event
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Events Hosted"
                        value={stats.eventsHosted}
                        description="Total events created"
                        icon={Calendar}
                        iconClassName="bg-nx-secondary-container text-nx-on-secondary-container"
                    />
                    <StatCard
                        title="Events Attending"
                        value={stats.eventsAttending}
                        description="Active registrations"
                        icon={TrendingUp}
                        iconClassName="bg-nx-tertiary-container text-nx-on-tertiary-container"
                    />
                    <StatCard
                        title="Organizations"
                        value={orgs.length}
                        description="Memberships"
                        icon={Building2}
                        iconClassName="bg-nx-success-container text-nx-on-success-container"
                    />
                    <StatCard
                        title="Upcoming"
                        value={stats.upcomingEvents.length}
                        description="Events this month"
                        icon={Star}
                        iconClassName="bg-nx-warning-container text-nx-on-warning-container"
                    />
                </div>

                {/* Upcoming Events */}
                <Card className="rounded-2xl border-nx-outline-variant/30 bg-nx-surface-container-lowest shadow-nx-card">
                    <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <CardTitle className="font-headline text-nx-on-surface">Upcoming Events</CardTitle>
                            <CardDescription className="text-nx-on-surface-variant">Events you&apos;re registered for</CardDescription>
                        </div>
                        <Link href="/my-events">
                            <Button variant="ghost" size="sm" className="gap-1 rounded-xl text-nx-primary hover:bg-nx-primary-container/40 hover:text-nx-primary">
                                View all <ArrowRight className="h-3 w-3" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {stats.upcomingEvents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Calendar className="mb-4 h-12 w-12 text-nx-on-surface-variant" />
                                <h3 className="mb-2 font-headline text-lg font-semibold text-nx-on-surface">No upcoming events</h3>
                                <p className="mb-4 text-nx-on-surface-variant">
                                    Browse events and register to join
                                </p>
                                <div className="flex flex-wrap justify-center gap-3">
                                    <Link href="/events/create">
                                        <Button className="rounded-xl bg-nx-primary text-nx-on-primary hover:bg-nx-primary/90">Create Event</Button>
                                    </Link>
                                    <Link href="/events">
                                        <Button variant="outline" className="rounded-xl border-nx-outline-variant/40">Browse Events</Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-nx-outline-variant/30">
                                {stats.upcomingEvents.map((p) => (
                                    <EventRow key={p.id} event={p.event} badge="attending" />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Organizations */}
                {orgs.length > 0 && (
                    <Card className="rounded-2xl border-nx-outline-variant/30 bg-nx-surface-container-lowest shadow-nx-card">
                        <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <CardTitle className="font-headline text-nx-on-surface">Your Organizations</CardTitle>
                                <CardDescription className="text-nx-on-surface-variant">Organizations you belong to</CardDescription>
                            </div>
                            <Link href="/organizations">
                                <Button variant="ghost" size="sm" className="gap-1 rounded-xl text-nx-primary hover:bg-nx-primary-container/40 hover:text-nx-primary">
                                    Manage <ArrowRight className="h-3 w-3" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                {orgs.slice(0, 4).map((org) => (
                                    <div key={org.id} className="flex min-w-0 flex-wrap items-center gap-3 rounded-xl border border-nx-outline-variant/30 bg-nx-surface-container-low p-3 transition-colors hover:bg-nx-surface-container">
                                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl bg-nx-secondary-container">
                                            {org.logo ? (
                                                <Image src={org.logo} alt={org.name} className="h-full w-full object-cover" width={50}
                                                    height={50} />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center">
                                                    <Building2 className="h-5 w-5 text-nx-on-secondary-container" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="truncate text-sm font-medium text-nx-on-surface">{org.name}</div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Badge variant="outline" className="h-4 border-nx-outline-variant/40 bg-nx-surface-container-lowest text-[10px] text-nx-on-surface-variant">{org.role}</Badge>
                                            </div>
                                        </div>
                                        {(org.role === "OWNER" || org.role === "ADMIN") && (
                                            <Link href={`/organizations/${org.id}/dashboard`}>
                                                <Button variant="ghost" size="sm" className="h-7 rounded-xl text-xs text-nx-primary hover:bg-nx-primary-container/40 hover:text-nx-primary">
                                                    Dashboard
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Recommended Events */}
                {recommendedEvents.length > 0 && (
                    <Card className="rounded-2xl border-nx-outline-variant/30 bg-nx-surface-container-lowest shadow-nx-card">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 font-headline text-nx-on-surface">
                                <Star className="h-5 w-5 text-nx-warning" />
                                Recommended For You
                            </CardTitle>
                            <CardDescription className="text-nx-on-surface-variant">
                                Public events in your industry you haven&apos;t joined yet
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="divide-y divide-nx-outline-variant/30">
                                {recommendedEvents.map((event) => (
                                    <EventRow key={event.id} event={event} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* AI Features Panel */}
                <Card className="rounded-2xl border border-nx-primary/20 bg-nx-surface-container-lowest shadow-nx-card">
                    <CardHeader className="pb-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <CardTitle className="flex items-center gap-2 font-headline text-nx-on-surface">
                                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-nx-primary-container">
                                    <Sparkles className="h-4 w-4 text-nx-on-primary-container" />
                                </div>
                                AI-Powered Features
                            </CardTitle>
                            <Badge className="border border-nx-success/20 bg-nx-success-container text-nx-on-success-container hover:bg-nx-success-container">
                                Live
                            </Badge>
                        </div>
                        <CardDescription className="text-nx-on-surface-variant">
                            Intelligent tools to enhance your event management and networking
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {/* RAG Chat */}
                            <div className="flex items-start gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-nx-outline-variant/30 hover:bg-nx-surface-container-low">
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-nx-tertiary-container">
                                    <MessageCircle className="h-4 w-4 text-nx-on-tertiary-container" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-headline text-sm font-medium text-nx-on-surface">AI Chat Assistant</p>
                                    <p className="mt-0.5 text-xs text-nx-on-surface-variant">
                                        Ask questions about any event or organization — answers grounded in real documents via RAG.
                                    </p>
                                </div>
                            </div>

                            {/* AI Writer */}
                            <div className="flex items-start gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-nx-outline-variant/30 hover:bg-nx-surface-container-low">
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-nx-secondary-container">
                                    <PenTool className="h-4 w-4 text-nx-on-secondary-container" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-headline text-sm font-medium text-nx-on-surface">AI Writer</p>
                                    <p className="mt-0.5 text-xs text-nx-on-surface-variant">
                                        Generate polished event descriptions from rough drafts, using your org&apos;s brand context.
                                    </p>
                                </div>
                            </div>

                            {/* Smart Recommendations */}
                            <div className="flex items-start gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-nx-outline-variant/30 hover:bg-nx-surface-container-low">
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-nx-warning-container">
                                    <Zap className="h-4 w-4 text-nx-on-warning-container" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-headline text-sm font-medium text-nx-on-surface">Smart Recommendations</p>
                                    <p className="mt-0.5 text-xs text-nx-on-surface-variant">
                                        Personalized event and organization suggestions powered by vector embeddings.
                                    </p>
                                </div>
                            </div>

                            {/* Enterprise Brainstorming */}
                            <div className="flex items-start gap-3 rounded-xl border border-transparent p-3 transition-colors hover:border-nx-outline-variant/30 hover:bg-nx-surface-container-low">
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-nx-success-container">
                                    <Bot className="h-4 w-4 text-nx-on-success-container" />
                                </div>
                                <div className="min-w-0">
                                    <p className="flex flex-wrap items-center gap-1.5 font-headline text-sm font-medium text-nx-on-surface">
                                        AI Event Brainstorming
                                        <Badge variant="outline" className="h-4 border-nx-primary/30 bg-nx-primary-container/30 px-1.5 text-[10px] text-nx-primary">Enterprise</Badge>
                                    </p>
                                    <p className="mt-0.5 text-xs text-nx-on-surface-variant">
                                        Brainstorm event ideas with AI, generate briefs, and pitch them to your org admin.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick action links */}
                        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-nx-outline-variant/30 pt-3">
                            <Link href="/events">
                                <Button variant="ghost" size="sm" className="h-7 gap-1 rounded-xl text-xs text-nx-primary hover:bg-nx-primary-container/40 hover:text-nx-primary">
                                    Browse Events <ArrowRight className="h-3 w-3" />
                                </Button>
                            </Link>
                            {user?.activeOrganizationId && (
                                <Link href={`/organizations/${user.activeOrganizationId}/ai-planner`}>
                                    <Button variant="ghost" size="sm" className="h-7 gap-1 rounded-xl text-xs text-nx-primary hover:bg-nx-primary-container/40 hover:text-nx-primary">
                                        <Sparkles className="h-3 w-3" /> AI Brainstorming
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DashboardPage;
