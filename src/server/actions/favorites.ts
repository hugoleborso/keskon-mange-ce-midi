"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "../auth";
import { db } from "../db";
import { favorites } from "../db/schema";

export async function toggleFavorite(restaurantId: string) {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Non authentifie");

	const existing = await db
		.select()
		.from(favorites)
		.where(and(eq(favorites.userId, session.user.id), eq(favorites.restaurantId, restaurantId)))
		.limit(1);

	if (existing.length > 0) {
		await db
			.delete(favorites)
			.where(
				and(eq(favorites.userId, session.user.id), eq(favorites.restaurantId, restaurantId)),
			);
	} else {
		await db.insert(favorites).values({
			userId: session.user.id,
			restaurantId,
		});
	}

	revalidatePath("/");
	revalidatePath("/favorites");
}
