import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock next/cache and next/navigation
vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	redirect: vi.fn(),
}));

// Mock geocoding
vi.mock("@/lib/geocoding", () => ({
	geocodeAddress: vi.fn(),
}));

// Mock auth
vi.mock("../auth", () => ({
	auth: vi.fn(),
}));

// Mock db with chainable insert/update builder
const mockReturning = vi.fn();
const mockInsertValues = vi.fn(() => ({ returning: mockReturning }));
const mockInsert = vi.fn(() => ({ values: mockInsertValues }));
const mockUpdateWhere = vi.fn();
const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere }));
const mockUpdate = vi.fn(() => ({ set: mockUpdateSet }));

vi.mock("../db", () => ({
	db: {
		insert: mockInsert,
		update: mockUpdate,
	},
}));

vi.mock("../db/schema", () => ({
	restaurants: { id: "id" },
}));

type MockFn = ReturnType<typeof vi.fn>;

const { createRestaurant, updateRestaurant } = await import("./restaurants");
const { auth } = (await import("../auth")) as unknown as { auth: MockFn };
const { geocodeAddress } = (await import("@/lib/geocoding")) as unknown as {
	geocodeAddress: MockFn;
};
const { redirect } = (await import("next/navigation")) as unknown as { redirect: MockFn };
const { revalidatePath } = (await import("next/cache")) as unknown as {
	revalidatePath: MockFn;
};

function makeFormData(data: Record<string, string | string[]>): FormData {
	const fd = new FormData();
	for (const [key, value] of Object.entries(data)) {
		if (Array.isArray(value)) {
			for (const v of value) fd.append(key, v);
		} else {
			fd.set(key, value);
		}
	}
	return fd;
}

describe("createRestaurant", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("throws when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);

		await expect(
			createRestaurant(makeFormData({ name: "Test", address: "12 rue" })),
		).rejects.toThrow("Non authentifie");
	});

	it("throws when session has no user id", async () => {
		auth.mockResolvedValueOnce({ user: {} });

		await expect(
			createRestaurant(makeFormData({ name: "Test", address: "12 rue" })),
		).rejects.toThrow("Non authentifie");
	});

	it("throws when geocoding fails", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		geocodeAddress.mockResolvedValueOnce(null);

		await expect(
			createRestaurant(makeFormData({ name: "Test", address: "unknown" })),
		).rejects.toThrow("Adresse introuvable");
	});

	it("creates restaurant and redirects on success", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		geocodeAddress.mockResolvedValueOnce({
			latitude: 48.85,
			longitude: 2.35,
			displayName: "Paris",
		});
		mockReturning.mockResolvedValueOnce([{ id: "new-id" }]);

		await createRestaurant(
			makeFormData({
				name: "Chez Luigi",
				address: "12 rue de la Paix",
				dineIn: "on",
			}),
		);

		expect(mockInsert).toHaveBeenCalled();
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
		expect(redirect).toHaveBeenCalledWith("/restaurants/new-id");
	});

	it("throws on invalid input (empty name)", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });

		await expect(createRestaurant(makeFormData({ name: "", address: "12 rue" }))).rejects.toThrow();
	});
});

describe("updateRestaurant", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("throws when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);

		await expect(
			updateRestaurant(
				makeFormData({
					id: "550e8400-e29b-41d4-a716-446655440000",
					name: "Test",
					address: "12 rue",
				}),
			),
		).rejects.toThrow("Non authentifie");
	});

	it("throws when geocoding fails", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		geocodeAddress.mockResolvedValueOnce(null);

		await expect(
			updateRestaurant(
				makeFormData({
					id: "550e8400-e29b-41d4-a716-446655440000",
					name: "Test",
					address: "nowhere",
				}),
			),
		).rejects.toThrow("Adresse introuvable");
	});

	it("updates restaurant and redirects on success", async () => {
		const id = "550e8400-e29b-41d4-a716-446655440000";
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		geocodeAddress.mockResolvedValueOnce({
			latitude: 48.85,
			longitude: 2.35,
			displayName: "Paris",
		});
		mockUpdateWhere.mockResolvedValueOnce(undefined);

		await updateRestaurant(
			makeFormData({
				id,
				name: "Updated Name",
				address: "New Address",
				takeAway: "on",
			}),
		);

		expect(mockUpdate).toHaveBeenCalled();
		expect(mockUpdateSet).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "Updated Name",
				address: "New Address",
				latitude: 48.85,
				longitude: 2.35,
			}),
		);
		expect(revalidatePath).toHaveBeenCalledWith("/");
		expect(revalidatePath).toHaveBeenCalledWith(`/restaurants/${id}`);
		expect(redirect).toHaveBeenCalledWith(`/restaurants/${id}`);
	});

	it("throws on invalid UUID", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });

		await expect(
			updateRestaurant(makeFormData({ id: "not-a-uuid", name: "Test", address: "12 rue" })),
		).rejects.toThrow();
	});
});
