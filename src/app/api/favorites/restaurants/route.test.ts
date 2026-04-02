import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("@/server/queries/favorites", () => ({
	getUserFavoriteRestaurants: vi.fn(),
}));

type MockFn = ReturnType<typeof vi.fn>;

const { GET } = await import("./route");
const { auth } = (await import("@/server/auth")) as unknown as { auth: MockFn };
const { getUserFavoriteRestaurants } = (await import("@/server/queries/favorites")) as unknown as {
	getUserFavoriteRestaurants: MockFn;
};

describe("GET /api/favorites/restaurants", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 401 when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);
		const res = await GET(
			new Request("http://localhost/api/favorites/restaurants") as unknown as NextRequest,
		);
		expect(res.status).toBe(401);
	});

	it("returns favorite restaurants on success", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		const restaurants = [{ id: "r-1", name: "Resto A", averageRating: 4.5, reviewsCount: 10 }];
		getUserFavoriteRestaurants.mockResolvedValueOnce(restaurants);

		const res = await GET(
			new Request("http://localhost/api/favorites/restaurants") as unknown as NextRequest,
		);

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data).toEqual(restaurants);
		expect(getUserFavoriteRestaurants).toHaveBeenCalledWith("user-1");
	});

	it("returns empty array when no favorites", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		getUserFavoriteRestaurants.mockResolvedValueOnce([]);

		const res = await GET(
			new Request("http://localhost/api/favorites/restaurants") as unknown as NextRequest,
		);

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data).toEqual([]);
	});
});
