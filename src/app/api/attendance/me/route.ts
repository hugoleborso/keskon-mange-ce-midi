import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getTodayDateString, getUserAttendance } from "@/server/queries/attendance";

export async function GET(request: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const date = searchParams.get("date") ?? getTodayDateString();

	const restaurantId = await getUserAttendance(session.user.id, date);
	return NextResponse.json({ data: restaurantId });
}
