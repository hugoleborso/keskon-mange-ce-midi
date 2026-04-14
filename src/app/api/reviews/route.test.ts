import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("@/server/queries/reviews", () => ({
	getReviewsByRestaurant: vi.fn(),
}));

const mockInsertValues = vi.fn();
const mockUpdateWhere = vi.fn();
const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere }));
const mockSelectLimit = vi.fn();
const mockSelectWhere = vi.fn(() => ({ limit: mockSelectLimit }));
const mockSelectFrom = vi.fn(() => ({ where: mockSelectWhere }));

vi.mock("@/server/db", () => ({
	db: {
		insert: vi.fn(() => ({ values: mockInsertValues })),
		update: vi.fn(() => ({ set: mockUpdateSet })),
		select: vi.fn(() => ({ from: mockSelectFrom })),
	},
}));

vi.mock("@/server/db/schema", () => ({
	reviews: { id: "id", restaurantId: "restaurant_id", authorId: "author_id" },
}));

type MockFn = ReturnType<typeof vi.fn>;

const { GET, POST, PATCH } = await import("./route");
const { auth } = (await import("@/server/auth")) as unknown as { auth: MockFn };
const { revalidatePath } = (await import("next/cache")) as unknown as {
	revalidatePath: MockFn;
};
const { getReviewsByRestaurant } = (await import("@/server/queries/reviews")) as unknown as {
	getReviewsByRestaurant: MockFn;
};

const validUuid = "550e8400-e29b-41d4-a716-446655440000";
const validRestaurantId = "660e8400-e29b-41d4-a716-446655440000";

function makeRequest(body: unknown): NextRequest {
	return new Request("http://localhost", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	}) as unknown as NextRequest;
}

describe("POST /api/reviews", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 401 when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);
		const res = await POST(makeRequest({}));
		expect(res.status).toBe(401);
	});

	it("returns 400 on invalid input", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		const res = await POST(makeRequest({ restaurantId: "bad", rating: 0 }));
		expect(res.status).toBe(400);
	});

	it("creates a review on success", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockInsertValues.mockResolvedValueOnce(undefined);

		const res = await POST(
			makeRequest({
				restaurantId: validRestaurantId,
				rating: 4,
				comment: "Delicieux",
				photoUrls: [],
			}),
		);

		expect(res.status).toBe(201);
		expect(mockInsertValues).toHaveBeenCalledWith(
			expect.objectContaining({
				restaurantId: validRestaurantId,
				rating: 4,
				comment: "Delicieux",
				authorId: "user-1",
			}),
		);
		expect(revalidatePath).toHaveBeenCalledWith(`/restaurants/${validRestaurantId}`);
		expect(revalidatePath).toHaveBeenCalledWith("/");
	});

	it("creates a review with photo URLs", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockInsertValues.mockResolvedValueOnce(undefined);

		await POST(
			makeRequest({
				restaurantId: validRestaurantId,
				rating: 4,
				photoUrls: ["https://example.com/photo1.jpg"],
			}),
		);

		expect(mockInsertValues).toHaveBeenCalledWith(
			expect.objectContaining({
				photoUrls: ["https://example.com/photo1.jpg"],
			}),
		);
	});
});

describe("PATCH /api/reviews", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 401 when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);
		const res = await PATCH(makeRequest({}));
		expect(res.status).toBe(401);
	});

	it("returns 404 when review not found", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([]);

		const res = await PATCH(makeRequest({ id: validUuid, rating: 5, photoUrls: [] }));
		expect(res.status).toBe(404);
	});

	it("returns 403 when not the author", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([
			{ authorId: "user-2", restaurantId: validRestaurantId },
		]);

		const res = await PATCH(makeRequest({ id: validUuid, rating: 5, photoUrls: [] }));
		expect(res.status).toBe(403);
	});

	it("updates review on success", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([
			{ authorId: "user-1", restaurantId: validRestaurantId },
		]);
		mockUpdateWhere.mockResolvedValueOnce(undefined);

		const res = await PATCH(
			makeRequest({ id: validUuid, rating: 5, comment: "Updated", photoUrls: [] }),
		);

		expect(res.status).toBe(200);
		expect(mockUpdateSet).toHaveBeenCalledWith(
			expect.objectContaining({ rating: 5, comment: "Updated" }),
		);
		expect(revalidatePath).toHaveBeenCalledWith(`/restaurants/${validRestaurantId}`);
	});
});

describe("GET /api/reviews", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 401 when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);
		const res = await GET(
			new Request(
				"http://localhost/api/reviews?restaurantId=550e8400-e29b-41d4-a716-446655440000",
			) as unknown as NextRequest,
		);
		expect(res.status).toBe(401);
	});

	it("returns 400 when restaurantId is missing", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		const res = await GET(new Request("http://localhost/api/reviews") as unknown as NextRequest);
		expect(res.status).toBe(400);
	});

	it("returns reviews on success", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		getReviewsByRestaurant.mockResolvedValueOnce([{ id: "rev-1", rating: 5 }]);

		const res = await GET(
			new Request(
				`http://localhost/api/reviews?restaurantId=${validRestaurantId}`,
			) as unknown as NextRequest,
		);

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data).toEqual([{ id: "rev-1", rating: 5 }]);
		expect(getReviewsByRestaurant).toHaveBeenCalledWith(validRestaurantId);
	});
});
