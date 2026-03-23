import { beforeEach, describe, expect, it, vi } from "vitest";

// Create a chainable mock that returns itself for any property access
function createChainMock(): Record<string, unknown> {
	const handler: ProxyHandler<object> = {
		get(_target, prop: string | symbol) {
			if (prop === "then") return undefined; // prevent Promise detection
			return (..._args: unknown[]) => new Proxy({}, handler);
		},
	};
	return new Proxy({}, handler) as Record<string, unknown>;
}

// Track the terminal calls we care about
const orderByResult = vi.fn();
const limitResult = vi.fn();

vi.mock("../db", () => {
	// The subquery chain: db.select().from().groupBy().as() — just needs to not throw
	const subqueryProxy = createChainMock();

	// The main query chains need to resolve to our mock results
	const mainChain = {
		select: vi.fn(() => ({
			from: vi.fn(() => ({
				leftJoin: vi.fn(() => ({
					where: vi.fn(() => ({
						orderBy: orderByResult,
						limit: limitResult,
					})),
				})),
			})),
		})),
	};

	// First call to db.select() is the subquery (module level)
	// Subsequent calls are the actual queries
	let callCount = 0;
	return {
		db: {
			select: vi.fn((...args: unknown[]) => {
				callCount++;
				if (callCount === 1) {
					const selectFn = subqueryProxy.select as (...a: unknown[]) => unknown;
					return selectFn(...args);
				}
				return mainChain.select();
			}),
		},
	};
});

const { getRestaurants, getRestaurantById } = await import("./restaurants");

describe("getRestaurants", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns mapped restaurants with rating data", async () => {
		const mockRow = {
			restaurant: {
				id: "1",
				name: "Chez Luigi",
				address: "12 rue",
				status: "active",
			},
			averageRating: 4.5,
			reviewsCount: 10,
		};
		orderByResult.mockResolvedValueOnce([mockRow]);

		const result = await getRestaurants();

		expect(result).toEqual([
			{
				id: "1",
				name: "Chez Luigi",
				address: "12 rue",
				status: "active",
				averageRating: 4.5,
				reviewsCount: 10,
			},
		]);
	});

	it("defaults null averageRating and 0 reviewsCount", async () => {
		const mockRow = {
			restaurant: { id: "2", name: "New Place" },
			averageRating: null,
			reviewsCount: null,
		};
		orderByResult.mockResolvedValueOnce([mockRow]);

		const result = await getRestaurants();

		expect(result[0].averageRating).toBeNull();
		expect(result[0].reviewsCount).toBe(0);
	});

	it("returns empty array when no restaurants", async () => {
		orderByResult.mockResolvedValueOnce([]);
		const result = await getRestaurants();
		expect(result).toEqual([]);
	});

	it("accepts filter parameters", async () => {
		orderByResult.mockResolvedValueOnce([]);

		await getRestaurants({
			dineIn: true,
			takeAway: false,
			priceRange: ["EUR_1", "EUR_2"],
		});

		expect(orderByResult).toHaveBeenCalled();
	});

	it("works without filters", async () => {
		orderByResult.mockResolvedValueOnce([]);
		await getRestaurants();
		expect(orderByResult).toHaveBeenCalled();
	});

	it("accepts categoryId filter", async () => {
		orderByResult.mockResolvedValueOnce([]);

		await getRestaurants({
			categoryId: "cat-1",
		});

		expect(orderByResult).toHaveBeenCalled();
	});
});

describe("getRestaurantById", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns the restaurant when found", async () => {
		const mockRow = {
			restaurant: { id: "abc", name: "Test" },
			averageRating: 3.0,
			reviewsCount: 5,
		};
		limitResult.mockResolvedValueOnce([mockRow]);

		const result = await getRestaurantById("abc");

		expect(result).toEqual({
			id: "abc",
			name: "Test",
			averageRating: 3.0,
			reviewsCount: 5,
		});
	});

	it("returns null when not found", async () => {
		limitResult.mockResolvedValueOnce([]);

		const result = await getRestaurantById("nonexistent");
		expect(result).toBeNull();
	});

	it("defaults null rating and 0 reviews for unreviewed restaurant", async () => {
		const mockRow = {
			restaurant: { id: "new", name: "Fresh" },
			averageRating: null,
			reviewsCount: null,
		};
		limitResult.mockResolvedValueOnce([mockRow]);

		const result = await getRestaurantById("new");

		expect(result?.averageRating).toBeNull();
		expect(result?.reviewsCount).toBe(0);
	});
});
