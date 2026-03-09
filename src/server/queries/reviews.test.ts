import { beforeEach, describe, expect, it, vi } from "vitest";

const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockWhere = vi.fn();

vi.mock("../db", () => {
	return {
		db: {
			select: vi.fn(() => ({
				from: vi.fn(() => ({
					innerJoin: vi.fn(() => ({
						where: vi.fn(() => ({
							orderBy: mockOrderBy,
						})),
					})),
					where: mockWhere,
				})),
			})),
		},
	};
});

mockWhere.mockReturnValue({ limit: mockLimit });

vi.mock("../db/schema", () => ({
	reviews: {
		restaurantId: "restaurant_id",
		authorId: "author_id",
		createdAt: "created_at",
		id: "id",
	},
	users: {
		id: "id",
		name: "name",
		image: "image",
	},
}));

const { getReviewsByRestaurant, getUserReview } = await import("./reviews");

describe("getReviewsByRestaurant", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns reviews with author info", async () => {
		const mockRows = [
			{
				review: {
					id: "r1",
					restaurantId: "rest-1",
					authorId: "user-1",
					rating: 4,
					comment: "Great!",
				},
				authorName: "Alice",
				authorImage: "https://example.com/alice.jpg",
			},
		];
		mockOrderBy.mockResolvedValueOnce(mockRows);

		const result = await getReviewsByRestaurant("rest-1");

		expect(result).toEqual([
			{
				id: "r1",
				restaurantId: "rest-1",
				authorId: "user-1",
				rating: 4,
				comment: "Great!",
				author: { name: "Alice", image: "https://example.com/alice.jpg" },
			},
		]);
	});

	it("returns empty array when no reviews", async () => {
		mockOrderBy.mockResolvedValueOnce([]);
		const result = await getReviewsByRestaurant("rest-1");
		expect(result).toEqual([]);
	});

	it("handles null author name and image", async () => {
		const mockRows = [
			{
				review: { id: "r2", rating: 3 },
				authorName: null,
				authorImage: null,
			},
		];
		mockOrderBy.mockResolvedValueOnce(mockRows);

		const result = await getReviewsByRestaurant("rest-1");

		expect(result[0].author).toEqual({ name: null, image: null });
	});
});

describe("getUserReview", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockWhere.mockReturnValue({ limit: mockLimit });
	});

	it("returns the review when found", async () => {
		const mockReview = { id: "r1", rating: 4, comment: "Nice" };
		mockLimit.mockResolvedValueOnce([mockReview]);

		const result = await getUserReview("rest-1", "user-1");
		expect(result).toEqual(mockReview);
	});

	it("returns null when not found", async () => {
		mockLimit.mockResolvedValueOnce([]);

		const result = await getUserReview("rest-1", "user-1");
		expect(result).toBeNull();
	});
});
