"use client";

import {
	parseAsArrayOf,
	parseAsBoolean,
	parseAsString,
	parseAsStringLiteral,
	useQueryStates,
} from "nuqs";
import { PRICE_RANGES } from "@/lib/constants";

export const filtersParsers = {
	dineIn: parseAsBoolean,
	takeAway: parseAsBoolean,
	priceRange: parseAsArrayOf(parseAsStringLiteral(PRICE_RANGES)),
	categoryId: parseAsString,
};

export function useFilters() {
	return useQueryStates(filtersParsers, { shallow: false });
}
