import { beforeEach, describe, expect, it, vi } from "vitest";

const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockWhere = vi.fn(() => ({ limit: mockLimit }));

vi.mock("../db", () => ({
	db: {
		select: vi.fn(() => ({
			from: vi.fn(() => ({
				orderBy: mockOrderBy,
				where: mockWhere,
			})),
		})),
	},
}));

vi.mock("../db/schema", () => ({
	categories: { id: "id", name: "name" },
}));

const { getCategories, getCategoryById } = await import("./categories");

describe("getCategories", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns all categories ordered by name", async () => {
		const mockCategories = [
			{ id: "1", name: "Burger", slug: "burger" },
			{ id: "2", name: "Italien", slug: "italien" },
		];
		mockOrderBy.mockResolvedValueOnce(mockCategories);

		const result = await getCategories();
		expect(result).toEqual(mockCategories);
	});

	it("returns empty array when no categories", async () => {
		mockOrderBy.mockResolvedValueOnce([]);
		const result = await getCategories();
		expect(result).toEqual([]);
	});
});

describe("getCategoryById", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns the category when found", async () => {
		const mockCategory = { id: "1", name: "Italien", slug: "italien" };
		mockLimit.mockResolvedValueOnce([mockCategory]);

		const result = await getCategoryById("1");
		expect(result).toEqual(mockCategory);
	});

	it("returns null when not found", async () => {
		mockLimit.mockResolvedValueOnce([]);

		const result = await getCategoryById("nonexistent");
		expect(result).toBeNull();
	});
});
