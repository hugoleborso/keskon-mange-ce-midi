import { beforeEach, describe, expect, it, vi } from "vitest";

const mockWhere = vi.fn();
const mockFavJoinOrderBy = vi.fn();

vi.mock("../db", () => {
	const subqueryHandler: ProxyHandler<object> = {
		get(_target, prop: string | symbol) {
			if (prop === "then") return undefined;
			return (..._args: unknown[]) => new Proxy({}, subqueryHandler);
		},
	};

	return {
		db: {
			select: vi.fn(() => ({
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
			})),
		},
	};
});

vi.mock("../db/schema", () => ({
	favorites: { userId: "user_id", restaurantId: "restaurant_id" },
	restaurants: { id: "id", name: "name" },
	reviews: { id: "id", restaurantId: "restaurant_id", rating: "rating" },
}));

const { getUserFavorites, isFavorite, getUserFavoriteRestaurants } = await import("./favorites");

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

describe("getUserFavoriteRestaurants", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns restaurants with rating data", async () => {
		const mockRow = {
			restaurant: { id: "r1", name: "Chez Luigi" },
			averageRating: 4.2,
			reviewsCount: 3,
		};
		mockFavJoinOrderBy.mockResolvedValueOnce([mockRow]);

		const result = await getUserFavoriteRestaurants("user-1");

		expect(result).toEqual([
			{
				id: "r1",
				name: "Chez Luigi",
				averageRating: 4.2,
				reviewsCount: 3,
			},
		]);
	});

	it("returns empty array when no favorites", async () => {
		mockFavJoinOrderBy.mockResolvedValueOnce([]);

		const result = await getUserFavoriteRestaurants("user-1");
		expect(result).toEqual([]);
	});

	it("defaults null averageRating and 0 reviewsCount", async () => {
		const mockRow = {
			restaurant: { id: "r2", name: "New Place" },
			averageRating: null,
			reviewsCount: null,
		};
		mockFavJoinOrderBy.mockResolvedValueOnce([mockRow]);

		const result = await getUserFavoriteRestaurants("user-1");

		expect(result[0].averageRating).toBeNull();
		expect(result[0].reviewsCount).toBe(0);
	});
});
