import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/geocoding", () => ({ geocodeAddress: vi.fn() }));

const mockReturning = vi.fn();
const mockInsertValues = vi.fn(() => {
	const result = Promise.resolve(undefined);
	(result as unknown as Record<string, unknown>).returning = mockReturning;
	return result;
});
const mockDeleteWhere = vi.fn();

vi.mock("@/server/db", () => ({
	db: {
		insert: vi.fn(() => ({ values: mockInsertValues })),
		delete: vi.fn(() => ({ where: mockDeleteWhere })),
	},
}));

vi.mock("@/server/db/schema", () => ({
	restaurants: { id: "id" },
	restaurantCategories: { restaurantId: "restaurant_id", categoryId: "category_id" },
}));

type MockFn = ReturnType<typeof vi.fn>;

const { POST } = await import("./route");
const { auth } = (await import("@/server/auth")) as unknown as { auth: MockFn };
const { geocodeAddress } = (await import("@/lib/geocoding")) as unknown as {
	geocodeAddress: MockFn;
};
const { revalidatePath } = (await import("next/cache")) as unknown as {
	revalidatePath: MockFn;
};

function makeRequest(body: unknown): NextRequest {
	return new Request("http://localhost", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	}) as unknown as NextRequest;
}

describe("POST /api/restaurants", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 401 when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);
		const res = await POST(makeRequest({ name: "Test", address: "12 rue" }));
		expect(res.status).toBe(401);
	});

	it("returns 400 on invalid input (empty name)", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		const res = await POST(makeRequest({ name: "", address: "12 rue" }));
		expect(res.status).toBe(400);
	});

	it("returns 422 when geocoding fails", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		geocodeAddress.mockResolvedValueOnce(null);

		const res = await POST(makeRequest({ name: "Test", address: "unknown", priceRange: "EUR_1" }));
		expect(res.status).toBe(422);
	});

	it("creates restaurant on success", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		geocodeAddress.mockResolvedValueOnce({ latitude: 48.85, longitude: 2.35 });
		mockReturning.mockResolvedValueOnce([{ id: "new-id" }]);

		const res = await POST(
			makeRequest({
				name: "Chez Luigi",
				address: "12 rue de la Paix",
				priceRange: "EUR_2",
				dineIn: true,
				categoryIds: [],
			}),
		);

		expect(res.status).toBe(201);
		expect(mockInsertValues).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "Chez Luigi",
				address: "12 rue de la Paix",
				latitude: 48.85,
				longitude: 2.35,
				createdBy: "user-1",
			}),
		);
		expect(revalidatePath).toHaveBeenCalledWith("/");
		const data = await res.json();
		expect(data.data.id).toBe("new-id");
	});

	it("uses provided coordinates without geocoding", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockReturning.mockResolvedValueOnce([{ id: "new-id" }]);

		const res = await POST(
			makeRequest({
				name: "Test Place",
				address: "123 Test St",
				priceRange: "EUR_1",
				latitude: 48.85,
				longitude: 2.35,
				dineIn: true,
				categoryIds: [],
			}),
		);

		expect(res.status).toBe(201);
		expect(geocodeAddress).not.toHaveBeenCalled();
		expect(mockInsertValues).toHaveBeenCalledWith(
			expect.objectContaining({ latitude: 48.85, longitude: 2.35 }),
		);
	});

	it("creates restaurant with categories", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		geocodeAddress.mockResolvedValueOnce({ latitude: 48.85, longitude: 2.35 });
		mockReturning.mockResolvedValueOnce([{ id: "new-id" }]);

		const res = await POST(
			makeRequest({
				name: "Test Place",
				address: "123 Test St",
				priceRange: "EUR_1",
				dineIn: true,
				categoryIds: [
					"550e8400-e29b-41d4-a716-446655440000",
					"660e8400-e29b-41d4-a716-446655440000",
				],
			}),
		);

		expect(res.status).toBe(201);
		expect(mockInsertValues).toHaveBeenCalledTimes(2);
	});
});
