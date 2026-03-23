import Link from "next/link";
import type { ReactNode } from "react";
import { PRICE_RANGE_LABELS } from "@/lib/constants";
import * as m from "@/paraglide/messages.js";
import type { RestaurantWithRating } from "@/server/queries/restaurants";

export function RestaurantCard({
	restaurant,
	favoriteButton,
	attendanceSlot,
}: {
	restaurant: RestaurantWithRating;
	favoriteButton?: ReactNode;
	attendanceSlot?: ReactNode;
}) {
	return (
		<div className="rounded-lg border p-4 transition-colors hover:bg-muted/50">
			<Link href={`/restaurants/${restaurant.id}`}>
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<h3 className="font-semibold">{restaurant.name}</h3>
						<p className="text-sm text-muted-foreground">{restaurant.address}</p>
					</div>
					<div className="flex items-center gap-2">
						{restaurant.priceRange && (
							<span className="text-sm font-medium">
								{PRICE_RANGE_LABELS[restaurant.priceRange]}
							</span>
						)}
						{favoriteButton}
					</div>
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
			{attendanceSlot && <div className="mt-3 border-t pt-3">{attendanceSlot}</div>}
		</div>
	);
}
