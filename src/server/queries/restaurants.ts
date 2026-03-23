import { and, avg, count, eq, inArray } from "drizzle-orm";
import type { PriceRange } from "@/lib/constants";
import { db } from "../db";
import { restaurants, reviews } from "../db/schema";

export type RestaurantWithRating = typeof restaurants.$inferSelect & {
	averageRating: number | null;
	reviewsCount: number;
};

const ratingSubquery = db
	.select({
		restaurantId: reviews.restaurantId,
		averageRating: avg(reviews.rating).mapWith(Number).as("average_rating"),
		reviewsCount: count(reviews.id).as("reviews_count"),
	})
	.from(reviews)
	.groupBy(reviews.restaurantId)
	.as("rating_stats");

export async function getRestaurants(filters?: {
	dineIn?: boolean;
	takeAway?: boolean;
	priceRange?: PriceRange[];
	categoryId?: string;
	status?: string;
}): Promise<RestaurantWithRating[]> {
	const conditions = [eq(restaurants.status, "active")];

	if (filters?.dineIn !== undefined) {
		conditions.push(eq(restaurants.dineIn, filters.dineIn));
	}
	if (filters?.takeAway !== undefined) {
		conditions.push(eq(restaurants.takeAway, filters.takeAway));
	}
	if (filters?.priceRange && filters.priceRange.length > 0) {
		conditions.push(inArray(restaurants.priceRange, filters.priceRange));
	}
	if (filters?.categoryId) {
		conditions.push(eq(restaurants.categoryId, filters.categoryId));
	}

	const rows = await db
		.select({
			restaurant: restaurants,
			averageRating: ratingSubquery.averageRating,
			reviewsCount: ratingSubquery.reviewsCount,
		})
		.from(restaurants)
		.leftJoin(ratingSubquery, eq(restaurants.id, ratingSubquery.restaurantId))
		.where(and(...conditions))
		.orderBy(restaurants.name);

	return rows.map((row) => ({
		...row.restaurant,
		averageRating: row.averageRating ?? null,
		reviewsCount: row.reviewsCount ?? 0,
	}));
}

export async function getRestaurantById(id: string): Promise<RestaurantWithRating | null> {
	const rows = await db
		.select({
			restaurant: restaurants,
			averageRating: ratingSubquery.averageRating,
			reviewsCount: ratingSubquery.reviewsCount,
		})
		.from(restaurants)
		.leftJoin(ratingSubquery, eq(restaurants.id, ratingSubquery.restaurantId))
		.where(eq(restaurants.id, id))
		.limit(1);

	if (rows.length === 0) return null;

	const row = rows[0];
	return {
		...row.restaurant,
		averageRating: row.averageRating ?? null,
		reviewsCount: row.reviewsCount ?? 0,
	};
}
