import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("../auth", () => ({
	auth: vi.fn(),
}));

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
	categories: { id: "id", name: "name" },
	restaurantCategories: { categoryId: "category_id", restaurantId: "restaurant_id" },
	users: { id: "id", role: "role" },
}));

type MockFn = ReturnType<typeof vi.fn>;

const { createCategory, updateCategory, deleteCategory } = await import("./categories");
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

function mockAdminAuth() {
	auth.mockResolvedValueOnce({ user: { id: "admin-1" } });
	mockSelectLimit.mockResolvedValueOnce([{ role: "admin" }]);
}

function mockUserAuth() {
	auth.mockResolvedValueOnce({ user: { id: "user-1" } });
	mockSelectLimit.mockResolvedValueOnce([{ role: "user" }]);
}

describe("createCategory", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("throws when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);
		await expect(createCategory(makeFormData({ name: "Italien" }))).rejects.toThrow(
			"Non authentifie",
		);
	});

	it("throws when not admin", async () => {
		mockUserAuth();
		await expect(createCategory(makeFormData({ name: "Italien" }))).rejects.toThrow("Non autorise");
	});

	it("creates category when admin", async () => {
		mockAdminAuth();
		mockInsertValues.mockResolvedValueOnce(undefined);

		await createCategory(makeFormData({ name: "Italien" }));

		expect(mockInsertValues).toHaveBeenCalledWith(
			expect.objectContaining({ name: "Italien", slug: "italien" }),
		);
		expect(revalidatePath).toHaveBeenCalledWith("/admin/categories");
		expect(revalidatePath).toHaveBeenCalledWith("/");
	});
});

describe("updateCategory", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("throws when not admin", async () => {
		mockUserAuth();
		await expect(
			updateCategory(
				makeFormData({ id: "550e8400-e29b-41d4-a716-446655440000", name: "Japonais" }),
			),
		).rejects.toThrow("Non autorise");
	});

	it("updates category when admin", async () => {
		mockAdminAuth();
		mockUpdateWhere.mockResolvedValueOnce(undefined);

		await updateCategory(
			makeFormData({ id: "550e8400-e29b-41d4-a716-446655440000", name: "Japonais" }),
		);

		expect(mockUpdateSet).toHaveBeenCalledWith(
			expect.objectContaining({ name: "Japonais", slug: "japonais" }),
		);
		expect(revalidatePath).toHaveBeenCalledWith("/admin/categories");
	});
});

describe("deleteCategory", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("throws when not admin", async () => {
		mockUserAuth();
		await expect(
			deleteCategory(makeFormData({ id: "550e8400-e29b-41d4-a716-446655440000" })),
		).rejects.toThrow("Non autorise");
	});

	it("deletes category and removes join table entries when admin", async () => {
		mockAdminAuth();
		mockDeleteWhere.mockResolvedValueOnce(undefined);
		mockDeleteWhere.mockResolvedValueOnce(undefined);

		await deleteCategory(makeFormData({ id: "550e8400-e29b-41d4-a716-446655440000" }));

		expect(mockDeleteWhere).toHaveBeenCalledTimes(2);
		expect(revalidatePath).toHaveBeenCalledWith("/admin/categories");
	});
});
