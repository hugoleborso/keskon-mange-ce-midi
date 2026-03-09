import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockSetFilters = vi.fn();

vi.mock("nuqs", () => ({
	parseAsBoolean: { parse: (v: string) => v === "true" },
	parseAsStringLiteral: (values: string[]) => ({
		parse: (v: string) => (values.includes(v) ? v : null),
	}),
	parseAsArrayOf: (parser: { parse: (v: string) => unknown }) => ({
		parse: (v: string) => v.split(",").map(parser.parse),
	}),
	useQueryStates: vi.fn(() => [{ dineIn: null, takeAway: null, priceRange: null }, mockSetFilters]),
}));

const { filtersParsers, useFilters } = await import("./use-filters");

describe("filtersParsers", () => {
	it("has dineIn, takeAway, and priceRange keys", () => {
		expect(filtersParsers).toHaveProperty("dineIn");
		expect(filtersParsers).toHaveProperty("takeAway");
		expect(filtersParsers).toHaveProperty("priceRange");
	});
});

describe("useFilters", () => {
	it("returns filters state and setter", () => {
		const { result } = renderHook(() => useFilters());

		const [filters, setFilters] = result.current;
		expect(filters).toEqual({ dineIn: null, takeAway: null, priceRange: null });
		expect(setFilters).toBe(mockSetFilters);
	});
});
