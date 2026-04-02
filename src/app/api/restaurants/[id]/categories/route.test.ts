import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("@/server/queries/restaurants", () => ({
	getRestaurantCategoryIds: vi.fn(),
}));

type MockFn = ReturnType<typeof vi.fn>;

const { GET } = await import("./route");
const { auth } = (await import("@/server/auth")) as unknown as { auth: MockFn };
const { getRestaurantCategoryIds } = (await import("@/server/queries/restaurants")) as unknown as {
	getRestaurantCategoryIds: MockFn;
};

const validId = "550e8400-e29b-41d4-a716-446655440000";

describe("GET /api/restaurants/[id]/categories", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 401 when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);
		const res = await GET(
			new Request(
				`http://localhost/api/restaurants/${validId}/categories`,
			) as unknown as NextRequest,
			{ params: Promise.resolve({ id: validId }) },
		);
		expect(res.status).toBe(401);
	});

	it("returns category IDs on success", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		const ids = ["cat-1", "cat-2"];
		getRestaurantCategoryIds.mockResolvedValueOnce(ids);

		const res = await GET(
			new Request(
				`http://localhost/api/restaurants/${validId}/categories`,
			) as unknown as NextRequest,
			{ params: Promise.resolve({ id: validId }) },
		);

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data).toEqual(ids);
		expect(getRestaurantCategoryIds).toHaveBeenCalledWith(validId);
	});

	it("returns empty array when restaurant has no categories", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		getRestaurantCategoryIds.mockResolvedValueOnce([]);

		const res = await GET(
			new Request(
				`http://localhost/api/restaurants/${validId}/categories`,
			) as unknown as NextRequest,
			{ params: Promise.resolve({ id: validId }) },
		);

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data).toEqual([]);
	});
});
