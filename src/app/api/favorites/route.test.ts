import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("@/server/queries/favorites", () => ({
	getUserFavorites: vi.fn(),
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
	favorites: { userId: "user_id", restaurantId: "restaurant_id" },
}));

type MockFn = ReturnType<typeof vi.fn>;

const { GET, POST } = await import("./route");
const { auth } = (await import("@/server/auth")) as unknown as { auth: MockFn };
const { revalidatePath } = (await import("next/cache")) as unknown as {
	revalidatePath: MockFn;
};
const { getUserFavorites } = (await import("@/server/queries/favorites")) as unknown as {
	getUserFavorites: MockFn;
};

const validRestaurantId = "550e8400-e29b-41d4-a716-446655440000";

function makeRequest(body: unknown): NextRequest {
	return new Request("http://localhost", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	}) as unknown as NextRequest;
}

describe("POST /api/favorites", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 401 when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);
		const res = await POST(makeRequest({ restaurantId: validRestaurantId }));
		expect(res.status).toBe(401);
	});

	it("returns 400 on invalid input", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		const res = await POST(makeRequest({ restaurantId: "not-a-uuid" }));
		expect(res.status).toBe(400);
	});

	it("adds favorite when not already favorited", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([]);
		mockInsertValues.mockResolvedValueOnce(undefined);

		const res = await POST(makeRequest({ restaurantId: validRestaurantId }));

		expect(res.status).toBe(200);
		expect(mockInsertValues).toHaveBeenCalledWith({
			userId: "user-1",
			restaurantId: validRestaurantId,
		});
		expect(revalidatePath).toHaveBeenCalledWith("/");
		expect(revalidatePath).toHaveBeenCalledWith("/favorites");
	});

	it("removes favorite when already favorited", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([{ userId: "user-1", restaurantId: validRestaurantId }]);
		mockDeleteWhere.mockResolvedValueOnce(undefined);

		const res = await POST(makeRequest({ restaurantId: validRestaurantId }));

		expect(res.status).toBe(200);
		expect(mockDeleteWhere).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith("/");
		expect(revalidatePath).toHaveBeenCalledWith("/favorites");
	});
});

describe("GET /api/favorites", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 401 when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);
		const res = await GET(new Request("http://localhost/api/favorites") as unknown as NextRequest);
		expect(res.status).toBe(401);
	});

	it("returns favorite restaurant IDs on success", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		getUserFavorites.mockResolvedValueOnce(["r-1", "r-2"]);

		const res = await GET(new Request("http://localhost/api/favorites") as unknown as NextRequest);

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data).toEqual(["r-1", "r-2"]);
		expect(getUserFavorites).toHaveBeenCalledWith("user-1");
	});
});
