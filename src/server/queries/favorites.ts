import { and, avg, count, eq } from "drizzle-orm";
import { db } from "../db";
import { favorites, restaurants, reviews } from "../db/schema";
import type { RestaurantWithRating } from "./restaurants";

export async function getUserFavorites(userId: string): Promise<string[]> {
	const rows = await db
		.select({ restaurantId: favorites.restaurantId })
		.from(favorites)
		.where(eq(favorites.userId, userId));

	return rows.map((r) => r.restaurantId);
}

export async function isFavorite(userId: string, restaurantId: string): Promise<boolean> {
	const rows = await db
		.select({ restaurantId: favorites.restaurantId })
		.from(favorites)
		.where(and(eq(favorites.userId, userId), eq(favorites.restaurantId, restaurantId)))
		.limit(1);

	return rows.length > 0;
}

export async function getUserFavoriteRestaurants(userId: string): Promise<RestaurantWithRating[]> {
	const ratingSubquery = db
		.select({
			restaurantId: reviews.restaurantId,
			averageRating: avg(reviews.rating).mapWith(Number).as("average_rating"),
			reviewsCount: count(reviews.id).as("reviews_count"),
		})
		.from(reviews)
		.groupBy(reviews.restaurantId)
		.as("rating_stats");

	const rows = await db
		.select({
			restaurant: restaurants,
			averageRating: ratingSubquery.averageRating,
			reviewsCount: ratingSubquery.reviewsCount,
		})
		.from(favorites)
		.innerJoin(restaurants, eq(favorites.restaurantId, restaurants.id))
		.leftJoin(ratingSubquery, eq(restaurants.id, ratingSubquery.restaurantId))
		.where(eq(favorites.userId, userId))
		.orderBy(restaurants.name);

	return rows.map((row) => ({
		...row.restaurant,
		averageRating: row.averageRating ?? null,
		reviewsCount: row.reviewsCount ?? 0,
	}));
}
