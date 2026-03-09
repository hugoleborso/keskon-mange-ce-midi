"use client";

import { useFilters } from "@/hooks/use-filters";
import * as m from "@/paraglide/messages.js";
import { PriceFilter } from "./price-filter";

export function FilterBar() {
	const [filters, setFilters] = useFilters();

	const toggleDineIn = () => {
		setFilters({ dineIn: filters.dineIn ? null : true });
	};

	const toggleTakeAway = () => {
		setFilters({ takeAway: filters.takeAway ? null : true });
	};

	const hasFilters =
		filters.dineIn !== null ||
		filters.takeAway !== null ||
		(filters.priceRange && filters.priceRange.length > 0);

	return (
		<div className="flex flex-wrap items-center gap-2">
			<button
				type="button"
				onClick={toggleDineIn}
				className={`rounded-full border px-3 py-1 text-sm transition-colors ${
					filters.dineIn ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
				}`}
			>
				{m.restaurant_dine_in()}
			</button>
			<button
				type="button"
				onClick={toggleTakeAway}
				className={`rounded-full border px-3 py-1 text-sm transition-colors ${
					filters.takeAway ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
				}`}
			>
				{m.restaurant_take_away()}
			</button>
			<PriceFilter
				selected={filters.priceRange ?? []}
				onChange={(priceRange) =>
					setFilters({ priceRange: priceRange.length > 0 ? priceRange : null })
				}
			/>
			{hasFilters && (
				<button
					type="button"
					onClick={() => setFilters({ dineIn: null, takeAway: null, priceRange: null })}
					className="text-xs text-muted-foreground hover:underline"
				>
					{m.filters_reset()}
				</button>
			)}
		</div>
	);
}
