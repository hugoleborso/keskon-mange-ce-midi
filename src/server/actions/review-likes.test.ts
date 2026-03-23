import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("../auth", () => ({
	auth: vi.fn(),
}));

const mockInsertValues = vi.fn();
const mockDeleteWhere = vi.fn();
const mockSelectLimit = vi.fn();
const mockSelectWhere = vi.fn(() => ({ limit: mockSelectLimit }));
const mockSelectFrom = vi.fn(() => ({ where: mockSelectWhere }));

vi.mock("../db", () => ({
	db: {
		insert: vi.fn(() => ({ values: mockInsertValues })),
		delete: vi.fn(() => ({ where: mockDeleteWhere })),
		select: vi.fn(() => ({ from: mockSelectFrom })),
	},
}));

vi.mock("../db/schema", () => ({
	reviewLikes: { userId: "user_id", reviewId: "review_id" },
	reviews: { id: "id", restaurantId: "restaurant_id" },
}));

type MockFn = ReturnType<typeof vi.fn>;

const { toggleReviewLike } = await import("./review-likes");
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

describe("toggleReviewLike", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("throws when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);
		await expect(toggleReviewLike(makeFormData({ reviewId: "r1" }))).rejects.toThrow(
			"Non authentifie",
		);
	});

	it("throws when reviewId is missing", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		await expect(toggleReviewLike(new FormData())).rejects.toThrow("ID requis");
	});

	it("adds like when not already liked", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([]);
		mockInsertValues.mockResolvedValueOnce(undefined);
		// For revalidation query
		mockSelectLimit.mockResolvedValueOnce([{ restaurantId: "rest-1" }]);

		await toggleReviewLike(makeFormData({ reviewId: "r1" }));

		expect(mockInsertValues).toHaveBeenCalledWith({ userId: "user-1", reviewId: "r1" });
		expect(revalidatePath).toHaveBeenCalledWith("/restaurants/rest-1");
	});

	it("removes like when already liked", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([{ userId: "user-1" }]);
		mockDeleteWhere.mockResolvedValueOnce(undefined);
		// For revalidation query
		mockSelectLimit.mockResolvedValueOnce([{ restaurantId: "rest-1" }]);

		await toggleReviewLike(makeFormData({ reviewId: "r1" }));

		expect(mockDeleteWhere).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith("/restaurants/rest-1");
	});
});
