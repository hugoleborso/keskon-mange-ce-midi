import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGroupBy = vi.fn();
const mockWhere = vi.fn();

vi.mock("../db", () => ({
	db: {
		select: vi.fn(() => ({
			from: vi.fn(() => ({
				where: (...args: unknown[]) => {
					const result = mockWhere(...args);
					// If mockWhere returns a value directly (for getUserReviewLikes), use it as a thenable
					if (result && typeof result.then === "function") {
						// mockWhere returned a promise
						return result;
					}
					// Otherwise return an object with groupBy (for getReviewLikeCounts)
					return { groupBy: mockGroupBy };
				},
			})),
		})),
	},
}));

vi.mock("../db/schema", () => ({
	reviewLikes: { userId: "user_id", reviewId: "review_id" },
}));

const { getReviewLikeCounts, getUserReviewLikes } = await import("./review-likes");

describe("getReviewLikeCounts", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns empty map for empty input", async () => {
		const result = await getReviewLikeCounts([]);
		expect(result.size).toBe(0);
	});

	it("returns like counts per review", async () => {
		mockGroupBy.mockResolvedValueOnce([
			{ reviewId: "r1", count: 3 },
			{ reviewId: "r2", count: 1 },
		]);

		const result = await getReviewLikeCounts(["r1", "r2"]);
		expect(result.get("r1")).toBe(3);
		expect(result.get("r2")).toBe(1);
	});
});

describe("getUserReviewLikes", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns empty set for empty input", async () => {
		const result = await getUserReviewLikes("u1", []);
		expect(result.size).toBe(0);
	});

	it("returns set of liked review IDs", async () => {
		mockWhere.mockReturnValueOnce(Promise.resolve([{ reviewId: "r1" }, { reviewId: "r3" }]));

		const result = await getUserReviewLikes("u1", ["r1", "r2", "r3"]);
		expect(result.has("r1")).toBe(true);
		expect(result.has("r2")).toBe(false);
		expect(result.has("r3")).toBe(true);
	});
});
