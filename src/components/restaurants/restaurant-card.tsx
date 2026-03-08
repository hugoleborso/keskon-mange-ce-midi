import Link from "next/link";
import { PRICE_RANGE_LABELS } from "@/lib/constants";
import * as m from "@/paraglide/messages.js";
import type { RestaurantWithRating } from "@/server/queries/restaurants";

export function RestaurantCard({ restaurant }: { restaurant: RestaurantWithRating }) {
	return (
		<Link
			href={`/restaurants/${restaurant.id}`}
			className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
		>
			<div className="flex items-start justify-between">
				<div>
					<h3 className="font-semibold">{restaurant.name}</h3>
					<p className="text-sm text-muted-foreground">{restaurant.address}</p>
				</div>
				{restaurant.priceRange && (
					<span className="text-sm font-medium">{PRICE_RANGE_LABELS[restaurant.priceRange]}</span>
				)}
			</div>
			<div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
				{restaurant.restaurantType && (
					<span className="rounded-md bg-secondary px-2 py-0.5">{restaurant.restaurantType}</span>
				)}
				<span>
					{restaurant.reviewsCount > 0
						? `⭐ ${restaurant.averageRating?.toFixed(1)} · ${m.restaurant_reviews({ count: restaurant.reviewsCount })}`
						: m.restaurant_no_reviews()}
				</span>
			</div>
		</Link>
	);
}
