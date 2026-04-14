import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getAllAttendanceForDate, getTodayDateString } from "@/server/queries/attendance";

export async function GET(request: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const date = searchParams.get("date") ?? getTodayDateString();

	const attendanceMap = await getAllAttendanceForDate(date);

	const data: Record<string, { userId: string; name: string | null; image: string | null }[]> = {};
	for (const [restaurantId, users] of attendanceMap) {
		data[restaurantId] = users;
	}

	return NextResponse.json({ data });
}
