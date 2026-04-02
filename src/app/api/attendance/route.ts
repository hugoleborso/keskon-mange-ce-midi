import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { toggleAttendanceSchema } from "@/lib/validations/attendance";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { lunchAttendance } from "@/server/db/schema";
import { getRestaurantAttendance, getTodayDateString } from "@/server/queries/attendance";

export async function GET(request: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const restaurantId = searchParams.get("restaurantId");
	if (!restaurantId) {
		return NextResponse.json({ error: "restaurantId requis" }, { status: 400 });
	}

	const date = searchParams.get("date") ?? getTodayDateString();
	const data = await getRestaurantAttendance(restaurantId, date);
	return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
	}

	let validated: ReturnType<typeof toggleAttendanceSchema.parse>;
	try {
		validated = toggleAttendanceSchema.parse(body);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: error.errors }, { status: 400 });
		}
		throw error;
	}

	const date = getTodayDateString();
	const userId = session.user.id;

	const [existing] = await db
		.select({ restaurantId: lunchAttendance.restaurantId })
		.from(lunchAttendance)
		.where(and(eq(lunchAttendance.userId, userId), eq(lunchAttendance.date, date)))
		.limit(1);

	if (existing) {
		if (existing.restaurantId === validated.restaurantId) {
			await db
				.delete(lunchAttendance)
				.where(and(eq(lunchAttendance.userId, userId), eq(lunchAttendance.date, date)));
		} else {
			await db
				.update(lunchAttendance)
				.set({ restaurantId: validated.restaurantId })
				.where(and(eq(lunchAttendance.userId, userId), eq(lunchAttendance.date, date)));
		}
	} else {
		await db.insert(lunchAttendance).values({ userId, restaurantId: validated.restaurantId, date });
	}

	revalidatePath("/");
	return NextResponse.json({ data: null });
}
