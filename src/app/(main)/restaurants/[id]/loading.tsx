export default function RestaurantDetailLoading() {
	return (
		<main className="mx-auto max-w-2xl p-4">
			<div className="mb-4 h-4 w-24 animate-pulse rounded bg-muted" />
			<div className="flex items-start justify-between">
				<div>
					<div className="h-7 w-48 animate-pulse rounded bg-muted" />
					<div className="mt-2 h-5 w-64 animate-pulse rounded bg-muted" />
				</div>
				<div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
			</div>
			<div className="mt-4 flex gap-2">
				<div className="h-7 w-16 animate-pulse rounded-md bg-muted" />
				<div className="h-7 w-12 animate-pulse rounded-md bg-muted" />
				<div className="h-7 w-20 animate-pulse rounded-md bg-muted" />
			</div>
			<div className="mt-4 h-4 w-32 animate-pulse rounded bg-muted" />
			<div className="mt-8">
				<div className="mb-4 h-6 w-16 animate-pulse rounded bg-muted" />
				<div className="space-y-4">
					<div className="h-32 animate-pulse rounded-lg border bg-muted" />
					<div className="h-24 animate-pulse rounded-lg border bg-muted" />
				</div>
			</div>
		</main>
	);
}
