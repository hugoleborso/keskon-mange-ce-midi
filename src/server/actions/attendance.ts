"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { toggleAttendanceSchema } from "@/lib/validations/attendance";
import { auth } from "../auth";
import { db } from "../db";
import { lunchAttendance } from "../db/schema";
import { getTodayDateString } from "../queries/attendance";

export async function toggleAttendance(formData: FormData) {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Non authentifie");

	const validated = toggleAttendanceSchema.parse({
		restaurantId: formData.get("restaurantId"),
	});

	const date = getTodayDateString();
	const userId = session.user.id;

	// Check if user already has attendance for today
	const [existing] = await db
		.select({ restaurantId: lunchAttendance.restaurantId })
		.from(lunchAttendance)
		.where(and(eq(lunchAttendance.userId, userId), eq(lunchAttendance.date, date)))
		.limit(1);

	if (existing) {
		if (existing.restaurantId === validated.restaurantId) {
			// Toggle off: remove attendance
			await db
				.delete(lunchAttendance)
				.where(and(eq(lunchAttendance.userId, userId), eq(lunchAttendance.date, date)));
		} else {
			// Switch restaurant: update existing attendance
			await db
				.update(lunchAttendance)
				.set({ restaurantId: validated.restaurantId })
				.where(and(eq(lunchAttendance.userId, userId), eq(lunchAttendance.date, date)));
		}
	} else {
		// New attendance
		await db.insert(lunchAttendance).values({
			userId,
			restaurantId: validated.restaurantId,
			date,
		});
	}

	revalidatePath("/");
}
