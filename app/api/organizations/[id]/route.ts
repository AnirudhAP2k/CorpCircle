import { NextRequest, NextResponse } from "next/server";
import {
	getOrganizationById,
	updateOrganizationAction,
	deleteOrganizationAction,
} from "@/domain/organizations";
import { getApiAuth } from "@/lib/api-auth";

const checkAuthentication = (req: NextRequest): NextResponse | null => {
	try {
		return getApiAuth(req)?.id
			? null
			: NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	} catch (error) {
		console.error("[checkAuthentication]", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
};

// GET /api/organizations/[id]
export const GET = async (
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) => {
	const user = getApiAuth(req);
	if (!user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const { id: organizationId } = await params;
		const organization = await getOrganizationById(organizationId);

		if (!organization) {
			return NextResponse.json(
				{ error: "Organization not found" },
				{ status: 404 },
			);
		}

		const isMember = organization.members.some(
			(member) => member.userId === user.id,
		);
		const safeOrganization = isMember
			? organization
			: {
					...organization,
					members: organization.members.map((member) => ({
						...member,
						user: {
							id: member.user.id,
							name: member.user.name,
							image: member.user.image,
						},
					})),
				};

		return NextResponse.json(
			{ success: true, organization: safeOrganization },
			{ status: 200 },
		);
	} catch (error) {
		console.error("[GET /api/organizations/[id]]", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
};

// PUT /api/organizations/[id]
export const PUT = async (
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) => {
	const unauthorized = checkAuthentication(req);
	if (unauthorized) return unauthorized;

	try {
		const { id: organizationId } = await params;
		const data = await req.json();

		const result = await updateOrganizationAction(organizationId, data);

		if (result.error) {
			const status =
				result.error === "Unauthorized. Please sign in."
					? 401
					: result.error.includes("permission")
						? 403
						: 400;
			return NextResponse.json(
				{ success: false, error: result.error },
				{ status },
			);
		}

		return NextResponse.json(
			{
				success: true,
				message: "Organization updated successfully",
				organization: result.organization,
			},
			{ status: 200 },
		);
	} catch (error) {
		console.error("[PUT /api/organizations/[id]]", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 },
		);
	}
};

// DELETE /api/organizations/[id]
export const DELETE = async (
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) => {
	const unauthorized = checkAuthentication(req);
	if (unauthorized) return unauthorized;

	try {
		const { id: organizationId } = await params;
		const result = await deleteOrganizationAction(organizationId);

		if (result.error) {
			const status =
				result.error === "Unauthorized. Please sign in."
					? 401
					: result.error.includes("owner")
						? 403
						: 400;
			return NextResponse.json({ error: result.error }, { status });
		}

		return NextResponse.json(
			{ message: "Organization deleted successfully" },
			{ status: 200 },
		);
	} catch (error) {
		console.error("[DELETE /api/organizations/[id]]", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
};
