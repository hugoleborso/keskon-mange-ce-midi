import Link from "next/link";
import * as m from "@/paraglide/messages.js";
import type { RestaurantWithRating } from "@/server/queries/restaurants";
import { RestaurantCard } from "./restaurant-card";

export function RestaurantList({ restaurants }: { restaurants: RestaurantWithRating[] }) {
	if (restaurants.length === 0) {
		return (
			<div className="flex flex-col items-center gap-4 py-12 text-center">
				<p className="text-muted-foreground">{m.restaurants_empty()}</p>
				<Link href="/restaurants/new" className="text-primary hover:underline">
					{m.restaurants_empty_cta()}
				</Link>
			</div>
		);
	}

	return (
		<div className="grid gap-3">
			{restaurants.map((restaurant) => (
				<RestaurantCard key={restaurant.id} restaurant={restaurant} />
			))}
		</div>
	);
}
