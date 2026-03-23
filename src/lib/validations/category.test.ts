import { describe, expect, it } from "vitest";
import {
	createCategorySchema,
	deleteCategorySchema,
	slugify,
	updateCategorySchema,
} from "./category";

describe("createCategorySchema", () => {
	it("validates a valid name", () => {
		const result = createCategorySchema.safeParse({ name: "Italien" });
		expect(result.success).toBe(true);
	});

	it("rejects empty name", () => {
		const result = createCategorySchema.safeParse({ name: "" });
		expect(result.success).toBe(false);
	});

	it("rejects name over 50 characters", () => {
		const result = createCategorySchema.safeParse({ name: "a".repeat(51) });
		expect(result.success).toBe(false);
	});
});

describe("updateCategorySchema", () => {
	it("validates with valid UUID and name", () => {
		const result = updateCategorySchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
			name: "Japonais",
		});
		expect(result.success).toBe(true);
	});

	it("rejects invalid UUID", () => {
		const result = updateCategorySchema.safeParse({ id: "bad", name: "Test" });
		expect(result.success).toBe(false);
	});
});

describe("deleteCategorySchema", () => {
	it("validates with valid UUID", () => {
		const result = deleteCategorySchema.safeParse({
			id: "550e8400-e29b-41d4-a716-446655440000",
		});
		expect(result.success).toBe(true);
	});

	it("rejects invalid UUID", () => {
		const result = deleteCategorySchema.safeParse({ id: "bad" });
		expect(result.success).toBe(false);
	});
});

describe("slugify", () => {
	it("converts to lowercase slug", () => {
		expect(slugify("Italien")).toBe("italien");
	});

	it("removes accents", () => {
		expect(slugify("Végétarien")).toBe("vegetarien");
	});

	it("replaces spaces with hyphens", () => {
		expect(slugify("Fast Food")).toBe("fast-food");
	});

	it("removes special characters", () => {
		expect(slugify("Café & Bistrot")).toBe("cafe-bistrot");
	});

	it("trims leading/trailing hyphens", () => {
		expect(slugify(" Test ")).toBe("test");
	});
});
