import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockSetFilters = vi.fn();

vi.mock("nuqs", () => ({
	parseAsBoolean: { parse: (v: string) => v === "true" },
	parseAsString: { parse: (v: string) => v || null },
	parseAsStringLiteral: (values: string[]) => ({
		parse: (v: string) => (values.includes(v) ? v : null),
	}),
	parseAsArrayOf: (parser: { parse: (v: string) => unknown }) => ({
		parse: (v: string) => v.split(",").map(parser.parse),
	}),
	useQueryStates: vi.fn(() => [
		{ dineIn: null, takeAway: null, priceRange: null, categoryId: null },
		mockSetFilters,
	]),
}));

const { filtersParsers, useFilters } = await import("./use-filters");

describe("filtersParsers", () => {
	it("has dineIn, takeAway, priceRange, and categoryId keys", () => {
		expect(filtersParsers).toHaveProperty("dineIn");
		expect(filtersParsers).toHaveProperty("takeAway");
		expect(filtersParsers).toHaveProperty("priceRange");
		expect(filtersParsers).toHaveProperty("categoryId");
	});
});

const { useQueryStates } = (await import("nuqs")) as unknown as {
	useQueryStates: ReturnType<typeof vi.fn>;
};

describe("useFilters", () => {
	it("returns filters state and setter", () => {
		const { result } = renderHook(() => useFilters());

		const [filters, setFilters] = result.current;
		expect(filters).toEqual({ dineIn: null, takeAway: null, priceRange: null, categoryId: null });
		expect(setFilters).toBe(mockSetFilters);
	});

	it("uses shallow: false to trigger server re-renders", () => {
		renderHook(() => useFilters());
		expect(useQueryStates).toHaveBeenCalledWith(expect.anything(), { shallow: false });
	});
});
