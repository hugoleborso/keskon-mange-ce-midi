import { describe, expect, it } from "vitest";
import { parsePriceRange } from "./parse-filters";

describe("parsePriceRange", () => {
	it("returns empty array for undefined", () => {
		expect(parsePriceRange(undefined)).toEqual([]);
	});

	it("returns empty array for empty string", () => {
		expect(parsePriceRange("")).toEqual([]);
	});

	it("parses a single valid string value", () => {
		expect(parsePriceRange("EUR_1")).toEqual(["EUR_1"]);
	});

	it("parses an array of valid values", () => {
		expect(parsePriceRange(["EUR_1", "EUR_3"])).toEqual(["EUR_1", "EUR_3"]);
	});

	it("filters out invalid values from array", () => {
		expect(parsePriceRange(["EUR_1", "INVALID", "EUR_2"])).toEqual(["EUR_1", "EUR_2"]);
	});

	it("returns empty array for invalid single string", () => {
		expect(parsePriceRange("INVALID")).toEqual([]);
	});

	it("handles all four price ranges", () => {
		expect(parsePriceRange(["EUR_1", "EUR_2", "EUR_3", "EUR_4"])).toEqual([
			"EUR_1",
			"EUR_2",
			"EUR_3",
			"EUR_4",
		]);
	});

	it("splits comma-separated strings (nuqs array format)", () => {
		expect(parsePriceRange("EUR_1,EUR_2")).toEqual(["EUR_1", "EUR_2"]);
	});
});
