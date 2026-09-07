import Image from "next/image";
import Link from "next/link";
import React from "react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import OrganizationSwitcher from "@/components/shared/OrganizationSwitcher";
import { prisma } from "@/lib/db";
import { getNotificationsByUserId } from "@/domain/notifications";
import MobileSidebar from "@/components/shared/MobileSidebar";
import { logout } from "@/actions/logout.actions";
import { TopNavLinks } from "@/components/shared/TopNavLinks";
import {
	NotificationBell,
	ReminderItem,
} from "@/components/shared/NotificationBell";
import { UnreadBadge } from "@/components/messaging/UnreadBadge";
import { getUserImage } from "@/domain/users";
import { LogOut } from "lucide-react";

const TopHeader = async () => {
	const session = await auth();

	let userOrganizations: any[] = [];
	let activeOrganizationId: string | null = null;
	const reminders: ReminderItem[] = [];
	const isAdmin = session?.user?.isAppAdmin || false;
	let userImage: string | null = null;

	if (session?.user?.id) {
		userImage = await getUserImage(session.user.id);

		const memberships = await prisma.organizationMember.findMany({
			where: { userId: session.user.id },
			include: {
				organization: {
					select: {
						id: true,
						name: true,
						logo: true,
						meta: { select: { verificationStatus: true } },
					},
				},
			},
		});

		userOrganizations = memberships.map((m) => m.organization);
		activeOrganizationId = session.user.activeOrganizationId || null;

		const pendingInvites = session.user.email
			? await prisma.pendingInvite.findMany({
					where: {
						email: session.user.email,
						status: "PENDING",
						expiresAt: { gt: new Date() },
					},
					include: { organization: true },
				})
			: [];

		const unverified = memberships.filter(
			(m) =>
				(m.role === "OWNER" || m.role === "ADMIN") &&
				m.organization.meta &&
				["AWAITING_DOCS", "REJECTED"].includes(
					m.organization.meta.verificationStatus || "",
				),
		);

		unverified.forEach((m) => {
			const status = m.organization.meta?.verificationStatus;
			reminders.push({
				id: `verify-${m.organization.id}`,
				type: "VERIFICATION",
				title:
					status === "REJECTED"
						? "Verification Rejected"
						: "Verification Required",
				description:
					status === "REJECTED"
						? `Admin notes were provided for ${m.organization.name}. Please resubmit.`
						: `Complete your KYB details for ${m.organization.name} to unlock all features.`,
				link: `/organizations/${m.organization.id}/complete-verification`,
				date: new Date(),
				read: false,
			});
		});
		pendingInvites.forEach((inv) => {
			reminders.push({
				id: `invite-${inv.id}`,
				type: "INVITE",
				title: "Organization Invitation",
				description: `You have been invited to join ${inv.organization.name} as ${inv.role}.`,
				link: "/dashboard",
				date: inv.createdAt,
				read: false,
			});
		});

		const dbNotifications = await getNotificationsByUserId(session.user.id, 20);

		dbNotifications.forEach((n) => {
			reminders.push({
				id: `db-${n.id}`,
				type: n.type as any,
				title: n.title,
				description: n.description,
				link: n.link || "#",
				date: n.createdAt,
				read: n.read,
			});
		});
	}

	// Sort all reminders by date descending
	reminders.sort((a, b) => b.date.getTime() - a.date.getTime());

	return (
		<header className="w-full border-b bg-background sticky top-0 z-40 h-16 shrink-0">
			<div className="flex items-center justify-between px-4 h-full container mx-auto max-w-[1600px]">
				<div className="flex items-center gap-2 md:gap-4">
					{session?.user && (
						<div className="md:hidden">
							<MobileSidebar
								userOrganizations={userOrganizations}
								activeOrganizationId={activeOrganizationId}
								isAdmin={isAdmin}
							/>
						</div>
					)}
					<Link
						href="/dashboard"
						className="flex flex-row items-center gap-2 hover:opacity-90 transition-opacity"
					>
						<div className="bg-nx-primary text-nx-on-primary p-1 rounded-lg flex items-center justify-center shadow-nx-primary">
							<span className="material-symbols-outlined text-2xl leading-none">
								hub
							</span>
						</div>
						<span className="font-headline font-bold text-xl tracking-tight text-nx-primary hidden md:block">
							CorpConnect
						</span>
					</Link>
				</div>

				{/* Centre nav — active-aware, client component */}
				<TopNavLinks />

				<div className="flex items-center gap-1 sm:gap-2 md:gap-4">
					{session && session?.user ? (
						<>
							<div className="hidden md:block">
								<OrganizationSwitcher
									organizations={userOrganizations}
									activeOrganizationId={activeOrganizationId}
								/>
							</div>
							<div className="md:hidden">
								<OrganizationSwitcher
									organizations={userOrganizations}
									activeOrganizationId={activeOrganizationId}
									variant="icon"
								/>
							</div>
							<div className="hidden md:flex items-center gap-2">
								<span className="text-xs font-medium text-nx-on-surface-variant uppercase tracking-wider hidden lg:block">
									{session.user.apiTier}
								</span>
							</div>

							<NotificationBell reminders={reminders} />
							<UnreadBadge />

							<div className="flex items-center gap-2 md:gap-3">
								<form action={logout} className="hidden md:block">
									<Button
										className="rounded-xl md:w-auto md:px-5"
										size="icon"
										type="submit"
										aria-label="Log out"
									>
										<LogOut className="h-4 w-4 md:hidden" />
										<span className="hidden md:inline">Logout</span>
									</Button>
								</form>
								<Link href={`/profile`}>
									<Image
										src={userImage || "/assets/avatars/avatar-blue.svg"}
										alt={session?.user?.name || "User Avatar"}
										width={36}
										height={36}
										className="rounded-full border"
									/>
								</Link>
								{/* Theme toggle stays hidden until authenticated light/dark visual QA passes. */}
							</div>
						</>
					) : (
						<div className="flex items-center gap-3">
							{/* Theme toggle stays hidden until light/dark visual QA passes. */}
							<Button asChild className="rounded-xl" size="lg">
								<Link href="/login">Login</Link>
							</Button>
						</div>
					)}
				</div>
			</div>
		</header>
	);
};

export default TopHeader;
