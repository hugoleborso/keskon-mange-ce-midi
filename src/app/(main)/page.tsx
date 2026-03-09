import Link from "next/link";
import { RestaurantMap } from "@/components/map/restaurant-map";
import { RestaurantList } from "@/components/restaurants/restaurant-list";
import * as m from "@/paraglide/messages.js";
import { getRestaurants } from "@/server/queries/restaurants";

export default async function HomePage() {
	const restaurants = await getRestaurants();

	return (
		<main className="flex h-[calc(100vh-57px)] flex-col lg:flex-row">
			<div className="h-[40vh] w-full shrink-0 lg:h-full lg:w-3/5">
				<RestaurantMap restaurants={restaurants} />
			</div>
			<div className="flex-1 overflow-y-auto p-4 lg:w-2/5">
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
			</div>
		</main>
	);
}
