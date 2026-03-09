import { RestaurantCardSkeleton } from "@/components/restaurants/restaurant-card-skeleton";

export default function FavoritesLoading() {
	return (
		<main className="mx-auto max-w-2xl p-4">
			<div className="mb-4 h-8 w-32 animate-pulse rounded bg-muted" />
			<div className="grid gap-3">
				<RestaurantCardSkeleton />
				<RestaurantCardSkeleton />
				<RestaurantCardSkeleton />
			</div>
		</main>
	);
}
