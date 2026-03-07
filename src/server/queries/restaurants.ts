import { and, avg, count, eq, ilike, inArray, sql } from "drizzle-orm";
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

export async function findPotentialDuplicates(name: string, excludeId?: string) {
	const conditions = [ilike(restaurants.name, `%${name}%`)];
	if (excludeId) {
		conditions.push(sql`${restaurants.id} != ${excludeId}`);
	}

	return db
		.select({ id: restaurants.id, name: restaurants.name, address: restaurants.address })
		.from(restaurants)
		.where(and(...conditions))
		.limit(5);
}
