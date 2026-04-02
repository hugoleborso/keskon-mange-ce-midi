import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/geocoding", () => ({ geocodeAddress: vi.fn() }));
vi.mock("@/server/queries/restaurants", () => ({
	getRestaurantById: vi.fn(),
}));

const mockInsertValues = vi.fn();
const mockUpdateWhere = vi.fn();
const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere }));
const mockDeleteWhere = vi.fn();

vi.mock("@/server/db", () => ({
	db: {
		insert: vi.fn(() => ({ values: mockInsertValues })),
		update: vi.fn(() => ({ set: mockUpdateSet })),
		delete: vi.fn(() => ({ where: mockDeleteWhere })),
	},
}));

vi.mock("@/server/db/schema", () => ({
	restaurants: { id: "id" },
	restaurantCategories: { restaurantId: "restaurant_id", categoryId: "category_id" },
}));

type MockFn = ReturnType<typeof vi.fn>;

const { GET, PATCH } = await import("./route");
const { auth } = (await import("@/server/auth")) as unknown as { auth: MockFn };
const { geocodeAddress } = (await import("@/lib/geocoding")) as unknown as {
	geocodeAddress: MockFn;
};
const { revalidatePath } = (await import("next/cache")) as unknown as {
	revalidatePath: MockFn;
};
const { getRestaurantById } = (await import("@/server/queries/restaurants")) as unknown as {
	getRestaurantById: MockFn;
};

const validId = "550e8400-e29b-41d4-a716-446655440000";

function makeRequest(body: unknown): NextRequest {
	return new Request("http://localhost", {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	}) as unknown as NextRequest;
}

function makeParams(id: string) {
	return { params: Promise.resolve({ id }) };
}

describe("PATCH /api/restaurants/[id]", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 401 when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);
		const res = await PATCH(
			makeRequest({ name: "Test", address: "12 rue", priceRange: "EUR_1" }),
			makeParams(validId),
		);
		expect(res.status).toBe(401);
	});

	it("returns 400 on invalid UUID in params", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		const res = await PATCH(
			makeRequest({ name: "Test", address: "12 rue", priceRange: "EUR_1" }),
			makeParams("not-a-uuid"),
		);
		expect(res.status).toBe(400);
	});

	it("returns 422 when geocoding fails", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		geocodeAddress.mockResolvedValueOnce(null);

		const res = await PATCH(
			makeRequest({ name: "Test", address: "nowhere", priceRange: "EUR_1", categoryIds: [] }),
			makeParams(validId),
		);
		expect(res.status).toBe(422);
	});

	it("updates restaurant on success", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		geocodeAddress.mockResolvedValueOnce({ latitude: 48.85, longitude: 2.35 });
		mockUpdateWhere.mockResolvedValueOnce(undefined);
		mockDeleteWhere.mockResolvedValueOnce(undefined);

		const res = await PATCH(
			makeRequest({
				name: "Updated Name",
				address: "New Address",
				priceRange: "EUR_2",
				takeAway: true,
				categoryIds: [],
			}),
			makeParams(validId),
		);

		expect(res.status).toBe(200);
		expect(mockUpdateSet).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "Updated Name",
				address: "New Address",
				latitude: 48.85,
				longitude: 2.35,
			}),
		);
		expect(revalidatePath).toHaveBeenCalledWith("/");
		expect(revalidatePath).toHaveBeenCalledWith(`/restaurants/${validId}`);
	});

	it("uses provided coordinates without geocoding", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockUpdateWhere.mockResolvedValueOnce(undefined);
		mockDeleteWhere.mockResolvedValueOnce(undefined);

		const res = await PATCH(
			makeRequest({
				name: "Updated",
				address: "New Address",
				priceRange: "EUR_1",
				latitude: 48.85,
				longitude: 2.35,
				takeAway: true,
				categoryIds: [],
			}),
			makeParams(validId),
		);

		expect(res.status).toBe(200);
		expect(geocodeAddress).not.toHaveBeenCalled();
		expect(mockUpdateSet).toHaveBeenCalledWith(
			expect.objectContaining({ latitude: 48.85, longitude: 2.35 }),
		);
	});

	it("updates restaurant with categories", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		geocodeAddress.mockResolvedValueOnce({ latitude: 48.85, longitude: 2.35 });
		mockUpdateWhere.mockResolvedValueOnce(undefined);
		mockDeleteWhere.mockResolvedValueOnce(undefined);
		mockInsertValues.mockResolvedValueOnce(undefined);

		const res = await PATCH(
			makeRequest({
				name: "Updated",
				address: "New Address",
				priceRange: "EUR_2",
				dineIn: true,
				categoryIds: ["550e8400-e29b-41d4-a716-446655440000"],
			}),
			makeParams(validId),
		);

		expect(res.status).toBe(200);
		expect(mockDeleteWhere).toHaveBeenCalled();
		expect(mockInsertValues).toHaveBeenCalled();
	});
});

function makeGetRequest(): NextRequest {
	return new Request(`http://localhost/api/restaurants/${validId}`) as unknown as NextRequest;
}

describe("GET /api/restaurants/[id]", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 401 when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);
		const res = await GET(makeGetRequest(), makeParams(validId));
		expect(res.status).toBe(401);
	});

	it("returns 404 when restaurant not found", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		getRestaurantById.mockResolvedValueOnce(null);

		const res = await GET(makeGetRequest(), makeParams(validId));
		expect(res.status).toBe(404);
	});

	it("returns restaurant on success", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		getRestaurantById.mockResolvedValueOnce({ id: validId, name: "Chez Luigi" });

		const res = await GET(makeGetRequest(), makeParams(validId));

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data).toEqual({ id: validId, name: "Chez Luigi" });
	});
});
