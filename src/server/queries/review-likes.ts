import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import { reviewLikes } from "../db/schema";

export async function getReviewLikeCounts(reviewIds: string[]): Promise<Map<string, number>> {
	if (reviewIds.length === 0) return new Map();

	const rows = await db
		.select({
			reviewId: reviewLikes.reviewId,
			count: count(reviewLikes.userId),
		})
		.from(reviewLikes)
		.where(inArray(reviewLikes.reviewId, reviewIds))
		.groupBy(reviewLikes.reviewId);

	const map = new Map<string, number>();
	for (const row of rows) {
		map.set(row.reviewId, row.count);
	}
	return map;
}

export async function getUserReviewLikes(
	userId: string,
	reviewIds: string[],
): Promise<Set<string>> {
	if (reviewIds.length === 0) return new Set();

	const rows = await db
		.select({ reviewId: reviewLikes.reviewId })
		.from(reviewLikes)
		.where(and(eq(reviewLikes.userId, userId), inArray(reviewLikes.reviewId, reviewIds)));

	return new Set(rows.map((r) => r.reviewId));
}
