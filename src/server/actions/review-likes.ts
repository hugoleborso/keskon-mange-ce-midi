"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "../auth";
import { db } from "../db";
import { reviewLikes, reviews } from "../db/schema";

export async function toggleReviewLike(formData: FormData) {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Non authentifie");

	const reviewId = formData.get("reviewId");
	if (typeof reviewId !== "string") throw new Error("ID requis");

	const userId = session.user.id;

	// Check if already liked
	const [existing] = await db
		.select({ userId: reviewLikes.userId })
		.from(reviewLikes)
		.where(and(eq(reviewLikes.userId, userId), eq(reviewLikes.reviewId, reviewId)))
		.limit(1);

	if (existing) {
		await db
			.delete(reviewLikes)
			.where(and(eq(reviewLikes.userId, userId), eq(reviewLikes.reviewId, reviewId)));
	} else {
		await db.insert(reviewLikes).values({ userId, reviewId });
	}

	// Get restaurantId for revalidation
	const [review] = await db
		.select({ restaurantId: reviews.restaurantId })
		.from(reviews)
		.where(eq(reviews.id, reviewId))
		.limit(1);

	if (review) {
		revalidatePath(`/restaurants/${review.restaurantId}`);
	}
}
