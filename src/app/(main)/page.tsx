import Link from "next/link";
import { FilterBar } from "@/components/filters/filter-bar";
import { RestaurantMap } from "@/components/map/restaurant-map";
import { DrawContainer } from "@/components/random-draw/draw-container";
import { RestaurantList } from "@/components/restaurants/restaurant-list";
import type { PriceRange } from "@/lib/constants";
import { PRICE_RANGES } from "@/lib/constants";
import * as m from "@/paraglide/messages.js";
import { auth } from "@/server/auth";
import { getUserFavorites } from "@/server/queries/favorites";
import { getRestaurants } from "@/server/queries/restaurants";

function parsePriceRange(value: string | string[] | undefined): PriceRange[] {
	if (!value) return [];
	const values = Array.isArray(value) ? value : value.split(",");
	return values.filter((v): v is PriceRange => (PRICE_RANGES as readonly string[]).includes(v));
}

export default async function HomePage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const params = await searchParams;

	const filters = {
		dineIn: params.dineIn === "true" ? true : undefined,
		takeAway: params.takeAway === "true" ? true : undefined,
		priceRange: parsePriceRange(params.priceRange),
	};

	const [restaurants, session] = await Promise.all([
		getRestaurants({
			dineIn: filters.dineIn,
			takeAway: filters.takeAway,
			priceRange: filters.priceRange.length > 0 ? filters.priceRange : undefined,
		}),
		auth(),
	]);

	const favoriteIds = session?.user?.id ? await getUserFavorites(session.user.id) : [];

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
				<div className="mb-4">
					<FilterBar />
				</div>
				<RestaurantList restaurants={restaurants} favoriteIds={favoriteIds} />
				<div className="sticky bottom-0 mt-4 bg-background pb-4 pt-2">
					<DrawContainer restaurants={restaurants} />
				</div>
			</div>
		</main>
	);
}
