import { and, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { reviews, users } from "../db/schema";

export type ReviewWithAuthor = typeof reviews.$inferSelect & {
	author: { name: string | null; image: string | null };
};

export async function getReviewsByRestaurant(restaurantId: string): Promise<ReviewWithAuthor[]> {
	const rows = await db
		.select({
			review: reviews,
			authorName: users.name,
			authorImage: users.image,
		})
		.from(reviews)
		.innerJoin(users, eq(reviews.authorId, users.id))
		.where(eq(reviews.restaurantId, restaurantId))
		.orderBy(desc(reviews.createdAt));

	return rows.map((row) => ({
		...row.review,
		author: { name: row.authorName, image: row.authorImage },
	}));
}

export async function getUserReview(
	restaurantId: string,
	userId: string,
): Promise<typeof reviews.$inferSelect | null> {
	const rows = await db
		.select()
		.from(reviews)
		.where(and(eq(reviews.restaurantId, restaurantId), eq(reviews.authorId, userId)))
		.limit(1);

	return rows[0] ?? null;
}
