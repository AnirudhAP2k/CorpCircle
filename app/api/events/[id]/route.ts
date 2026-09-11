import { NextRequest, NextResponse } from "next/server";
import { updateEventAction, deleteEventAction } from "@/domain/events";
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

// PUT /api/events/[id] — update an event
export const PUT = async (
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) => {
	const unauthorized = checkAuthentication(req);
	if (unauthorized) return unauthorized;

	try {
		const { id: eventId } = await params;
		const data = await req.json();
		const result = await updateEventAction(eventId, data);

		if (result.error) {
			const status =
				result.error === "Unauthorized. Please sign in."
					? 401
					: result.error.includes("owners")
						? 403
						: 400;
			return NextResponse.json({ error: result.error }, { status });
		}

		return NextResponse.json(
			{ message: "Event updated successfully!", event: result.event },
			{ status: 200 },
		);
	} catch (error) {
		console.error("[PUT /api/events/[id]]", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
};

// DELETE /api/events/[id] — delete an event by path param
export const DELETE = async (
	req: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) => {
	const unauthorized = checkAuthentication(req);
	if (unauthorized) return unauthorized;

	try {
		const { id: eventId } = await params;
		const result = await deleteEventAction(eventId);

		if (result.error) {
			const status =
				result.error === "Unauthorized. Please sign in."
					? 401
					: result.error.includes("owners")
						? 403
						: 400;
			return NextResponse.json({ error: result.error }, { status });
		}

		return NextResponse.json(
			{ message: "Event deleted successfully" },
			{ status: 200 },
		);
	} catch (error) {
		console.error("[DELETE /api/events/[id]]", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
};
