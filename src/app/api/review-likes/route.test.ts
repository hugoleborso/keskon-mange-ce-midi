import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("@/server/queries/reviews", () => ({
	getReviewsByRestaurant: vi.fn(),
}));
vi.mock("@/server/queries/review-likes", () => ({
	getReviewLikeCounts: vi.fn(),
	getUserReviewLikes: vi.fn(),
}));

const mockInsertValues = vi.fn();
const mockDeleteWhere = vi.fn();
const mockSelectLimit = vi.fn();
const mockSelectWhere = vi.fn(() => ({ limit: mockSelectLimit }));
const mockSelectFrom = vi.fn(() => ({ where: mockSelectWhere }));

vi.mock("@/server/db", () => ({
	db: {
		insert: vi.fn(() => ({ values: mockInsertValues })),
		delete: vi.fn(() => ({ where: mockDeleteWhere })),
		select: vi.fn(() => ({ from: mockSelectFrom })),
	},
}));

vi.mock("@/server/db/schema", () => ({
	reviewLikes: { userId: "user_id", reviewId: "review_id" },
	reviews: { id: "id", restaurantId: "restaurant_id" },
}));

type MockFn = ReturnType<typeof vi.fn>;

const { GET, POST } = await import("./route");
const { auth } = (await import("@/server/auth")) as unknown as { auth: MockFn };
const { revalidatePath } = (await import("next/cache")) as unknown as {
	revalidatePath: MockFn;
};
const { getReviewsByRestaurant } = (await import("@/server/queries/reviews")) as unknown as {
	getReviewsByRestaurant: MockFn;
};
const { getReviewLikeCounts, getUserReviewLikes } = (await import(
	"@/server/queries/review-likes"
)) as unknown as {
	getReviewLikeCounts: MockFn;
	getUserReviewLikes: MockFn;
};

const validReviewId = "550e8400-e29b-41d4-a716-446655440000";
const validRestaurantId = "660e8400-e29b-41d4-a716-446655440000";

function makeRequest(body: unknown): NextRequest {
	return new Request("http://localhost", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	}) as unknown as NextRequest;
}

describe("POST /api/review-likes", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 401 when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);
		const res = await POST(makeRequest({ reviewId: validReviewId }));
		expect(res.status).toBe(401);
	});

	it("returns 400 when reviewId is invalid", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		const res = await POST(makeRequest({ reviewId: "not-a-uuid" }));
		expect(res.status).toBe(400);
	});

	it("adds like when not already liked", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([]);
		mockInsertValues.mockResolvedValueOnce(undefined);
		mockSelectLimit.mockResolvedValueOnce([{ restaurantId: "rest-1" }]);

		const res = await POST(makeRequest({ reviewId: validReviewId }));

		expect(res.status).toBe(200);
		expect(mockInsertValues).toHaveBeenCalledWith({ userId: "user-1", reviewId: validReviewId });
		expect(revalidatePath).toHaveBeenCalledWith("/restaurants/rest-1");
	});

	it("removes like when already liked", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([{ userId: "user-1" }]);
		mockDeleteWhere.mockResolvedValueOnce(undefined);
		mockSelectLimit.mockResolvedValueOnce([{ restaurantId: "rest-1" }]);

		const res = await POST(makeRequest({ reviewId: validReviewId }));

		expect(res.status).toBe(200);
		expect(mockDeleteWhere).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith("/restaurants/rest-1");
	});
});

describe("GET /api/review-likes", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 401 when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);
		const res = await GET(
			new Request(
				`http://localhost/api/review-likes?restaurantId=${validRestaurantId}`,
			) as unknown as NextRequest,
		);
		expect(res.status).toBe(401);
	});

	it("returns 400 when restaurantId is missing", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		const res = await GET(
			new Request("http://localhost/api/review-likes") as unknown as NextRequest,
		);
		expect(res.status).toBe(400);
	});

	it("returns counts and userLikes on success", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		getReviewsByRestaurant.mockResolvedValueOnce([{ id: "rev-1" }, { id: "rev-2" }]);
		getReviewLikeCounts.mockResolvedValueOnce(new Map([["rev-1", 3]]));
		getUserReviewLikes.mockResolvedValueOnce(new Set(["rev-1"]));

		const res = await GET(
			new Request(
				`http://localhost/api/review-likes?restaurantId=${validRestaurantId}`,
			) as unknown as NextRequest,
		);

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data.counts).toEqual({ "rev-1": 3 });
		expect(body.data.userLikes).toEqual(["rev-1"]);
		expect(getReviewsByRestaurant).toHaveBeenCalledWith(validRestaurantId);
		expect(getReviewLikeCounts).toHaveBeenCalledWith(["rev-1", "rev-2"]);
		expect(getUserReviewLikes).toHaveBeenCalledWith("user-1", ["rev-1", "rev-2"]);
	});

	it("returns empty data when no reviews exist", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		getReviewsByRestaurant.mockResolvedValueOnce([]);
		getReviewLikeCounts.mockResolvedValueOnce(new Map());
		getUserReviewLikes.mockResolvedValueOnce(new Set());

		const res = await GET(
			new Request(
				`http://localhost/api/review-likes?restaurantId=${validRestaurantId}`,
			) as unknown as NextRequest,
		);

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data.counts).toEqual({});
		expect(body.data.userLikes).toEqual([]);
	});
});
