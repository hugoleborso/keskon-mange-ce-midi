import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("../auth", () => ({
	auth: vi.fn(),
}));

// Mock db with chainable builders
const mockInsertValues = vi.fn();

const mockUpdateWhere = vi.fn();
const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere }));

const mockDeleteWhere = vi.fn();

const mockSelectLimit = vi.fn();
const mockSelectWhere = vi.fn(() => ({ limit: mockSelectLimit }));
const mockSelectFrom = vi.fn(() => ({ where: mockSelectWhere }));

vi.mock("../db", () => ({
	db: {
		insert: vi.fn(() => ({ values: mockInsertValues })),
		update: vi.fn(() => ({ set: mockUpdateSet })),
		delete: vi.fn(() => ({ where: mockDeleteWhere })),
		select: vi.fn(() => ({ from: mockSelectFrom })),
	},
}));

vi.mock("../db/schema", () => ({
	reviews: {
		id: "id",
		restaurantId: "restaurant_id",
		authorId: "author_id",
	},
}));

type MockFn = ReturnType<typeof vi.fn>;

const { createReview, updateReview, deleteReview } = await import("./reviews");
const { auth } = (await import("../auth")) as unknown as { auth: MockFn };
const { revalidatePath } = (await import("next/cache")) as unknown as {
	revalidatePath: MockFn;
};

function makeFormData(data: Record<string, string>): FormData {
	const fd = new FormData();
	for (const [key, value] of Object.entries(data)) {
		fd.set(key, value);
	}
	return fd;
}

const validUuid = "550e8400-e29b-41d4-a716-446655440000";
const validRestaurantId = "660e8400-e29b-41d4-a716-446655440000";

describe("createReview", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("throws when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);

		await expect(
			createReview(makeFormData({ restaurantId: validRestaurantId, rating: "4" })),
		).rejects.toThrow("Non authentifie");
	});

	it("creates a review on success", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockInsertValues.mockResolvedValueOnce(undefined);

		await createReview(
			makeFormData({
				restaurantId: validRestaurantId,
				rating: "4",
				comment: "Delicieux",
			}),
		);

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

	it("throws on invalid input", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });

		await expect(
			createReview(makeFormData({ restaurantId: "bad", rating: "0" })),
		).rejects.toThrow();
	});
});

describe("updateReview", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("throws when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);

		await expect(updateReview(makeFormData({ id: validUuid, rating: "5" }))).rejects.toThrow(
			"Non authentifie",
		);
	});

	it("throws when review not found", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([]);

		await expect(updateReview(makeFormData({ id: validUuid, rating: "5" }))).rejects.toThrow(
			"Avis introuvable",
		);
	});

	it("throws when not the author", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([
			{ authorId: "user-2", restaurantId: validRestaurantId },
		]);

		await expect(updateReview(makeFormData({ id: validUuid, rating: "5" }))).rejects.toThrow(
			"Non autorise",
		);
	});

	it("updates review on success", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([
			{ authorId: "user-1", restaurantId: validRestaurantId },
		]);
		mockUpdateWhere.mockResolvedValueOnce(undefined);

		await updateReview(makeFormData({ id: validUuid, rating: "5", comment: "Updated" }));

		expect(mockUpdateSet).toHaveBeenCalledWith(
			expect.objectContaining({ rating: 5, comment: "Updated" }),
		);
		expect(revalidatePath).toHaveBeenCalledWith(`/restaurants/${validRestaurantId}`);
	});
});

describe("deleteReview", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("throws when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);

		await expect(deleteReview(makeFormData({ id: validUuid }))).rejects.toThrow("Non authentifie");
	});

	it("throws when review not found", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([]);

		await expect(deleteReview(makeFormData({ id: validUuid }))).rejects.toThrow("Avis introuvable");
	});

	it("throws when not the author", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([
			{ authorId: "user-2", restaurantId: validRestaurantId },
		]);

		await expect(deleteReview(makeFormData({ id: validUuid }))).rejects.toThrow("Non autorise");
	});

	it("deletes review on success", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([
			{ authorId: "user-1", restaurantId: validRestaurantId },
		]);
		mockDeleteWhere.mockResolvedValueOnce(undefined);

		await deleteReview(makeFormData({ id: validUuid }));

		expect(mockDeleteWhere).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith(`/restaurants/${validRestaurantId}`);
		expect(revalidatePath).toHaveBeenCalledWith("/");
	});

	it("throws when id is missing", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });

		await expect(deleteReview(new FormData())).rejects.toThrow("ID requis");
	});
});
