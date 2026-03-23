"use client";

import { useFilters } from "@/hooks/use-filters";
import * as m from "@/paraglide/messages.js";
import { PriceFilter } from "./price-filter";

type Category = { id: string; name: string };

export function FilterBar({ categories }: { categories?: Category[] }) {
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
		(filters.priceRange && filters.priceRange.length > 0) ||
		filters.categoryId !== null;

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
			{categories && categories.length > 0 && (
				<select
					value={filters.categoryId ?? ""}
					onChange={(e) => setFilters({ categoryId: e.target.value || null })}
					className={`rounded-full border px-3 py-1 text-sm transition-colors ${
						filters.categoryId
							? "border-primary bg-primary text-primary-foreground"
							: "hover:bg-muted"
					}`}
				>
					<option value="">{m.category_filter_all()}</option>
					{categories.map((cat) => (
						<option key={cat.id} value={cat.id}>
							{cat.name}
						</option>
					))}
				</select>
			)}
			{hasFilters && (
				<button
					type="button"
					onClick={() =>
						setFilters({ dineIn: null, takeAway: null, priceRange: null, categoryId: null })
					}
					className="text-xs text-muted-foreground hover:underline"
				>
					{m.filters_reset()}
				</button>
			)}
		</div>
	);
}
