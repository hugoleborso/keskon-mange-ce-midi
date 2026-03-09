"use client";

import Link from "next/link";
import { Popup } from "react-leaflet";
import { PRICE_RANGE_LABELS } from "@/lib/constants";
import * as m from "@/paraglide/messages.js";
import type { RestaurantWithRating } from "@/server/queries/restaurants";

export function MapPopup({ restaurant }: { restaurant: RestaurantWithRating }) {
	return (
		<Popup>
			<div className="min-w-[180px]">
				<Link
					href={`/restaurants/${restaurant.id}`}
					className="font-semibold text-primary hover:underline"
				>
					{restaurant.name}
				</Link>
				<div className="mt-1 flex flex-wrap gap-1 text-xs text-muted-foreground">
					{restaurant.restaurantType && <span>{restaurant.restaurantType}</span>}
					{restaurant.priceRange && (
						<>
							{restaurant.restaurantType && <span>·</span>}
							<span>{PRICE_RANGE_LABELS[restaurant.priceRange]}</span>
						</>
					)}
				</div>
				<div className="mt-1 text-xs">
					{restaurant.reviewsCount > 0
						? `⭐ ${restaurant.averageRating?.toFixed(1)} · ${m.restaurant_reviews({ count: restaurant.reviewsCount })}`
						: m.restaurant_no_reviews()}
				</div>
			</div>
		</Popup>
	);
}
