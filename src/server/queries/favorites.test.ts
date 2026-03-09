import { beforeEach, describe, expect, it, vi } from "vitest";

const mockWhere = vi.fn();

// Chain mock for getUserFavoriteRestaurants (complex join query)
const mockFavJoinOrderBy = vi.fn();

vi.mock("../db", () => {
	// Subquery proxy for rating stats
	const subqueryHandler: ProxyHandler<object> = {
		get(_target, prop: string | symbol) {
			if (prop === "then") return undefined;
			return (..._args: unknown[]) => new Proxy({}, subqueryHandler);
		},
	};

	let selectCallCount = 0;

	return {
		db: {
			select: vi.fn(() => {
				selectCallCount++;
				// First call might be subquery (inside getUserFavoriteRestaurants)
				if (selectCallCount <= 1) {
					return {
						from: vi.fn(() => ({
							where: mockWhere,
							innerJoin: vi.fn(() => ({
								leftJoin: vi.fn(() => ({
									where: vi.fn(() => ({
										orderBy: mockFavJoinOrderBy,
									})),
								})),
							})),
							groupBy: vi.fn(() => ({
								as: vi.fn(() => new Proxy({}, subqueryHandler)),
							})),
						})),
					};
				}
				return {
					from: vi.fn(() => ({
						where: mockWhere,
						innerJoin: vi.fn(() => ({
							leftJoin: vi.fn(() => ({
								where: vi.fn(() => ({
									orderBy: mockFavJoinOrderBy,
								})),
							})),
						})),
						groupBy: vi.fn(() => ({
							as: vi.fn(() => new Proxy({}, subqueryHandler)),
						})),
					})),
				};
			}),
		},
	};
});

vi.mock("../db/schema", () => ({
	favorites: { userId: "user_id", restaurantId: "restaurant_id" },
	restaurants: { id: "id", name: "name" },
	reviews: { id: "id", restaurantId: "restaurant_id", rating: "rating" },
}));

const { getUserFavorites, isFavorite } = await import("./favorites");

describe("getUserFavorites", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns restaurant ids", async () => {
		mockWhere.mockResolvedValueOnce([{ restaurantId: "r1" }, { restaurantId: "r2" }]);

		const result = await getUserFavorites("user-1");
		expect(result).toEqual(["r1", "r2"]);
	});

	it("returns empty array when no favorites", async () => {
		mockWhere.mockResolvedValueOnce([]);

		const result = await getUserFavorites("user-1");
		expect(result).toEqual([]);
	});
});

describe("isFavorite", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns true when favorite exists", async () => {
		mockWhere.mockReturnValueOnce({
			limit: vi.fn().mockResolvedValueOnce([{ restaurantId: "r1" }]),
		});

		const result = await isFavorite("user-1", "r1");
		expect(result).toBe(true);
	});

	it("returns false when not favorited", async () => {
		mockWhere.mockReturnValueOnce({ limit: vi.fn().mockResolvedValueOnce([]) });

		const result = await isFavorite("user-1", "r1");
		expect(result).toBe(false);
	});
});
