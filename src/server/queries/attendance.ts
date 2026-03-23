import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { lunchAttendance, users } from "../db/schema";

export type AttendanceUser = {
	userId: string;
	name: string | null;
	image: string | null;
};

export function getTodayDateString(): string {
	return new Date().toISOString().split("T")[0];
}

export async function getRestaurantAttendance(
	restaurantId: string,
	date: string,
): Promise<AttendanceUser[]> {
	const rows = await db
		.select({
			userId: lunchAttendance.userId,
			name: users.name,
			image: users.image,
		})
		.from(lunchAttendance)
		.innerJoin(users, eq(lunchAttendance.userId, users.id))
		.where(and(eq(lunchAttendance.restaurantId, restaurantId), eq(lunchAttendance.date, date)));

	return rows;
}

export async function getAllAttendanceForDate(
	date: string,
): Promise<Map<string, AttendanceUser[]>> {
	const rows = await db
		.select({
			restaurantId: lunchAttendance.restaurantId,
			userId: lunchAttendance.userId,
			name: users.name,
			image: users.image,
		})
		.from(lunchAttendance)
		.innerJoin(users, eq(lunchAttendance.userId, users.id))
		.where(eq(lunchAttendance.date, date));

	const map = new Map<string, AttendanceUser[]>();
	for (const row of rows) {
		const existing = map.get(row.restaurantId) ?? [];
		existing.push({ userId: row.userId, name: row.name, image: row.image });
		map.set(row.restaurantId, existing);
	}
	return map;
}

export async function getUserAttendance(userId: string, date: string): Promise<string | null> {
	const rows = await db
		.select({ restaurantId: lunchAttendance.restaurantId })
		.from(lunchAttendance)
		.where(and(eq(lunchAttendance.userId, userId), eq(lunchAttendance.date, date)))
		.limit(1);

	return rows[0]?.restaurantId ?? null;
}
