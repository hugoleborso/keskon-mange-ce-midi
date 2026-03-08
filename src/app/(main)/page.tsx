import Link from "next/link";
import { RestaurantList } from "@/components/restaurants/restaurant-list";
import * as m from "@/paraglide/messages.js";
import { getRestaurants } from "@/server/queries/restaurants";

export default async function HomePage() {
	const restaurants = await getRestaurants();

	return (
		<main className="mx-auto max-w-2xl p-4">
			<div className="mb-4 flex items-center justify-between">
				<h1 className="text-2xl font-bold">{m.app_title()}</h1>
				<Link
					href="/restaurants/new"
					className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
				>
					{m.restaurants_add()}
				</Link>
			</div>
			<RestaurantList restaurants={restaurants} />
		</main>
	);
}
