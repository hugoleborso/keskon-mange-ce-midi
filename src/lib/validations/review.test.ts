import { describe, expect, it } from "vitest";
import { createReviewSchema, updateReviewSchema } from "./review";

const validUuid = "550e8400-e29b-41d4-a716-446655440000";

describe("createReviewSchema", () => {
	it("accepts valid input", () => {
		const result = createReviewSchema.parse({
			restaurantId: validUuid,
			rating: 4,
			comment: "Super resto !",
		});
		expect(result.rating).toBe(4);
		expect(result.comment).toBe("Super resto !");
	});

	it("accepts input without comment", () => {
		const result = createReviewSchema.parse({
			restaurantId: validUuid,
			rating: 3,
		});
		expect(result.comment).toBeUndefined();
	});

	it("coerces string rating to number", () => {
		const result = createReviewSchema.parse({
			restaurantId: validUuid,
			rating: "5",
		});
		expect(result.rating).toBe(5);
	});

	it("rejects rating below 1", () => {
		expect(() =>
			createReviewSchema.parse({
				restaurantId: validUuid,
				rating: 0,
			}),
		).toThrow();
	});

	it("rejects rating above 5", () => {
		expect(() =>
			createReviewSchema.parse({
				restaurantId: validUuid,
				rating: 6,
			}),
		).toThrow();
	});

	it("rejects non-integer rating", () => {
		expect(() =>
			createReviewSchema.parse({
				restaurantId: validUuid,
				rating: 3.5,
			}),
		).toThrow();
	});

	it("rejects invalid UUID", () => {
		expect(() =>
			createReviewSchema.parse({
				restaurantId: "not-a-uuid",
				rating: 3,
			}),
		).toThrow();
	});

	it("rejects comment longer than 1000 chars", () => {
		expect(() =>
			createReviewSchema.parse({
				restaurantId: validUuid,
				rating: 3,
				comment: "a".repeat(1001),
			}),
		).toThrow();
	});

	it("accepts empty string comment", () => {
		const result = createReviewSchema.parse({
			restaurantId: validUuid,
			rating: 3,
			comment: "",
		});
		expect(result.comment).toBe("");
	});

	it("accepts valid photoUrls", () => {
		const result = createReviewSchema.parse({
			restaurantId: validUuid,
			rating: 4,
			photoUrls: ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"],
		});
		expect(result.photoUrls).toHaveLength(2);
	});

	it("defaults photoUrls to empty array", () => {
		const result = createReviewSchema.parse({
			restaurantId: validUuid,
			rating: 4,
		});
		expect(result.photoUrls).toEqual([]);
	});

	it("rejects more than 5 photos", () => {
		expect(() =>
			createReviewSchema.parse({
				restaurantId: validUuid,
				rating: 4,
				photoUrls: Array.from({ length: 6 }, (_, i) => `https://example.com/photo${i}.jpg`),
			}),
		).toThrow();
	});

	it("rejects invalid photo URLs", () => {
		expect(() =>
			createReviewSchema.parse({
				restaurantId: validUuid,
				rating: 4,
				photoUrls: ["not-a-url"],
			}),
		).toThrow();
	});
});

describe("updateReviewSchema", () => {
	it("accepts valid input", () => {
		const result = updateReviewSchema.parse({
			id: validUuid,
			rating: 5,
			comment: "Updated",
		});
		expect(result.id).toBe(validUuid);
		expect(result.rating).toBe(5);
	});

	it("rejects invalid id", () => {
		expect(() =>
			updateReviewSchema.parse({
				id: "not-valid",
				rating: 3,
			}),
		).toThrow();
	});

	it("rejects missing rating", () => {
		expect(() =>
			updateReviewSchema.parse({
				id: validUuid,
			}),
		).toThrow();
	});
});
