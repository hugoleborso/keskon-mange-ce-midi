import { describe, expect, it, vi } from "vitest";

vi.mock("nuqs", () => ({
	parseAsBoolean: { parse: (v: string) => v === "true" },
	parseAsStringLiteral: (values: string[]) => ({
		parse: (v: string) => (values.includes(v) ? v : null),
	}),
	parseAsArrayOf: (parser: { parse: (v: string) => unknown }) => ({
		parse: (v: string) => v.split(",").map(parser.parse),
	}),
	useQueryStates: vi.fn(() => [{ dineIn: null, takeAway: null, priceRange: null }, vi.fn()]),
}));

const { filtersParsers } = await import("./use-filters");

describe("filtersParsers", () => {
	it("has dineIn, takeAway, and priceRange keys", () => {
		expect(filtersParsers).toHaveProperty("dineIn");
		expect(filtersParsers).toHaveProperty("takeAway");
		expect(filtersParsers).toHaveProperty("priceRange");
	});
});
