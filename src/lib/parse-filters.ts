import type { PriceRange } from "./constants";
import { PRICE_RANGES } from "./constants";

export function parsePriceRange(value: string | string[] | undefined): PriceRange[] {
	if (!value) return [];
	const values = Array.isArray(value) ? value : [value];
	return values.filter((v): v is PriceRange => (PRICE_RANGES as readonly string[]).includes(v));
}
