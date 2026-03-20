export function RestaurantCardSkeleton() {
	return (
		<div className="animate-pulse rounded-lg border p-4">
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<div className="h-5 w-40 rounded bg-muted" />
					<div className="mt-2 h-4 w-56 rounded bg-muted" />
				</div>
				<div className="h-4 w-8 rounded bg-muted" />
			</div>
			<div className="mt-3 flex items-center gap-2">
				<div className="h-6 w-16 rounded-md bg-muted" />
				<div className="h-4 w-24 rounded bg-muted" />
			</div>
		</div>
	);
}
