import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth", () => ({ auth: vi.fn() }));

const mockDeleteWhere = vi.fn();
const mockSelectLimit = vi.fn();
const mockSelectWhere = vi.fn(() => ({ limit: mockSelectLimit }));
const mockSelectFrom = vi.fn(() => ({ where: mockSelectWhere }));

vi.mock("@/server/db", () => ({
	db: {
		delete: vi.fn(() => ({ where: mockDeleteWhere })),
		select: vi.fn(() => ({ from: mockSelectFrom })),
	},
}));

vi.mock("@/server/db/schema", () => ({
	reviews: { id: "id", restaurantId: "restaurant_id", authorId: "author_id" },
}));

type MockFn = ReturnType<typeof vi.fn>;

const { DELETE } = await import("./route");
const { auth } = (await import("@/server/auth")) as unknown as { auth: MockFn };
const { revalidatePath } = (await import("next/cache")) as unknown as {
	revalidatePath: MockFn;
};

const validUuid = "550e8400-e29b-41d4-a716-446655440000";
const validRestaurantId = "660e8400-e29b-41d4-a716-446655440000";

function makeRequest(): NextRequest {
	return new Request("http://localhost", {
		method: "DELETE",
	}) as unknown as NextRequest;
}

function makeParams(id: string) {
	return { params: Promise.resolve({ id }) };
}

describe("DELETE /api/reviews/[id]", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 401 when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);
		const res = await DELETE(makeRequest(), makeParams(validUuid));
		expect(res.status).toBe(401);
	});

	it("returns 404 when review not found", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([]);

		const res = await DELETE(makeRequest(), makeParams(validUuid));
		expect(res.status).toBe(404);
	});

	it("returns 403 when not the author", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([
			{ authorId: "user-2", restaurantId: validRestaurantId },
		]);

		const res = await DELETE(makeRequest(), makeParams(validUuid));
		expect(res.status).toBe(403);
	});

	it("deletes review on success", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([
			{ authorId: "user-1", restaurantId: validRestaurantId },
		]);
		mockDeleteWhere.mockResolvedValueOnce(undefined);

		const res = await DELETE(makeRequest(), makeParams(validUuid));

		expect(res.status).toBe(200);
		expect(mockDeleteWhere).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith(`/restaurants/${validRestaurantId}`);
		expect(revalidatePath).toHaveBeenCalledWith("/");
	});
});
