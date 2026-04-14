import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("@/server/queries/reviews", () => ({
	getUserReview: vi.fn(),
}));

type MockFn = ReturnType<typeof vi.fn>;

const { GET } = await import("./route");
const { auth } = (await import("@/server/auth")) as unknown as { auth: MockFn };
const { getUserReview } = (await import("@/server/queries/reviews")) as unknown as {
	getUserReview: MockFn;
};

const validRestaurantId = "550e8400-e29b-41d4-a716-446655440000";

describe("GET /api/reviews/me", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 401 when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);
		const res = await GET(
			new Request(
				`http://localhost/api/reviews/me?restaurantId=${validRestaurantId}`,
			) as unknown as NextRequest,
		);
		expect(res.status).toBe(401);
	});

	it("returns 400 when restaurantId is missing", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		const res = await GET(new Request("http://localhost/api/reviews/me") as unknown as NextRequest);
		expect(res.status).toBe(400);
	});

	it("returns the user review when found", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		const review = { id: "rev-1", rating: 4, comment: "Good" };
		getUserReview.mockResolvedValueOnce(review);

		const res = await GET(
			new Request(
				`http://localhost/api/reviews/me?restaurantId=${validRestaurantId}`,
			) as unknown as NextRequest,
		);

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data).toEqual(review);
		expect(getUserReview).toHaveBeenCalledWith(validRestaurantId, "user-1");
	});

	it("returns null when no review exists", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		getUserReview.mockResolvedValueOnce(null);

		const res = await GET(
			new Request(
				`http://localhost/api/reviews/me?restaurantId=${validRestaurantId}`,
			) as unknown as NextRequest,
		);

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data).toBeNull();
	});
});
