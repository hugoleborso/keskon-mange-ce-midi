"use client";

import Link from "next/link";
import { PRICE_RANGE_LABELS } from "@/lib/constants";
import * as m from "@/paraglide/messages.js";
import type { RestaurantWithRating } from "@/server/queries/restaurants";

export function DrawResult({
	restaurant,
	onRedraw,
}: {
	restaurant: RestaurantWithRating;
	onRedraw: () => void;
}) {
	return (
		<div className="space-y-3 rounded-xl border-2 border-primary bg-card p-4">
			<div className="text-center">
				<p className="text-sm text-muted-foreground">{m.draw_result_label()}</p>
				<h3 className="text-xl font-bold">{restaurant.name}</h3>
				<div className="mt-1 flex items-center justify-center gap-2 text-sm text-muted-foreground">
					{restaurant.restaurantType && <span>{restaurant.restaurantType}</span>}
					{restaurant.priceRange && (
						<>
							{restaurant.restaurantType && <span>·</span>}
							<span>{PRICE_RANGE_LABELS[restaurant.priceRange]}</span>
						</>
					)}
					{restaurant.reviewsCount > 0 && (
						<>
							<span>·</span>
							<span>{`⭐ ${restaurant.averageRating?.toFixed(1)}`}</span>
						</>
					)}
				</div>
			</div>
			<div className="flex gap-2">
				<Link
					href={`/restaurants/${restaurant.id}`}
					className="flex-1 rounded-lg border px-4 py-2 text-center text-sm hover:bg-muted"
				>
					{m.draw_view_restaurant()}
				</Link>
				<button
					type="button"
					onClick={onRedraw}
					className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
				>
					{m.draw_retry()}
				</button>
			</div>
		</div>
	);
}
