"use client";

import { parseAsArrayOf, parseAsBoolean, parseAsStringLiteral, useQueryStates } from "nuqs";
import { PRICE_RANGES } from "@/lib/constants";

export const filtersParsers = {
	dineIn: parseAsBoolean,
	takeAway: parseAsBoolean,
	priceRange: parseAsArrayOf(parseAsStringLiteral(PRICE_RANGES)),
};

export function useFilters() {
	return useQueryStates(filtersParsers);
}
