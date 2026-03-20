"use client";

import type { PriceRange } from "@/lib/constants";
import { PRICE_RANGE_LABELS, PRICE_RANGES } from "@/lib/constants";

export function PriceFilter({
	selected,
	onChange,
}: {
	selected: PriceRange[];
	onChange: (selected: PriceRange[]) => void;
}) {
	const toggle = (range: PriceRange) => {
		if (selected.includes(range)) {
			onChange(selected.filter((r) => r !== range));
		} else {
			onChange([...selected, range]);
		}
	};

	return (
		<div className="flex gap-1">
			{PRICE_RANGES.map((range) => {
				const isActive = selected.includes(range);
				return (
					<button
						key={range}
						type="button"
						onClick={() => toggle(range)}
						className={`rounded-full border px-2.5 py-1 text-sm transition-colors ${
							isActive ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
						}`}
					>
						{PRICE_RANGE_LABELS[range]}
					</button>
				);
			})}
		</div>
	);
}
