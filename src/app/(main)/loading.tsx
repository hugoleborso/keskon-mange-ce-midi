import { RestaurantCardSkeleton } from "@/components/restaurants/restaurant-card-skeleton";

export default function HomeLoading() {
	return (
		<main className="flex h-[calc(100vh-57px)] flex-col lg:flex-row">
			<div className="h-[40vh] w-full shrink-0 bg-muted lg:h-full lg:w-3/5" />
			<div className="flex-1 overflow-y-auto p-4 lg:w-2/5">
				<div className="mb-4 flex items-center justify-between">
					<div className="h-8 w-40 animate-pulse rounded bg-muted" />
					<div className="h-10 w-36 animate-pulse rounded-lg bg-muted" />
				</div>
				<div className="mb-4">
					<div className="flex gap-2">
						<div className="h-8 w-20 animate-pulse rounded-full bg-muted" />
						<div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
						<div className="h-8 w-10 animate-pulse rounded-full bg-muted" />
						<div className="h-8 w-10 animate-pulse rounded-full bg-muted" />
					</div>
				</div>
				<div className="grid gap-3">
					<RestaurantCardSkeleton />
					<RestaurantCardSkeleton />
					<RestaurantCardSkeleton />
					<RestaurantCardSkeleton />
				</div>
			</div>
		</main>
	);
}
