import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth", () => ({ auth: vi.fn() }));

const mockInsertValues = vi.fn();
const mockUpdateWhere = vi.fn();
const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere }));
const mockDeleteWhere = vi.fn();
const mockSelectLimit = vi.fn();
const mockSelectWhere = vi.fn(() => ({ limit: mockSelectLimit }));
const mockSelectFrom = vi.fn(() => ({ where: mockSelectWhere }));

vi.mock("@/server/db", () => ({
	db: {
		insert: vi.fn(() => ({ values: mockInsertValues })),
		update: vi.fn(() => ({ set: mockUpdateSet })),
		delete: vi.fn(() => ({ where: mockDeleteWhere })),
		select: vi.fn(() => ({ from: mockSelectFrom })),
	},
}));

vi.mock("@/server/db/schema", () => ({
	categories: { id: "id", name: "name" },
	restaurantCategories: { categoryId: "category_id", restaurantId: "restaurant_id" },
	users: { id: "id", role: "role" },
}));

type MockFn = ReturnType<typeof vi.fn>;

const { PATCH, DELETE } = await import("./route");
const { auth } = (await import("@/server/auth")) as unknown as { auth: MockFn };
const { revalidatePath } = (await import("next/cache")) as unknown as {
	revalidatePath: MockFn;
};

const validUuid = "550e8400-e29b-41d4-a716-446655440000";

function makeRequest(body: unknown, method = "PATCH"): NextRequest {
	return new Request("http://localhost", {
		method,
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	}) as unknown as NextRequest;
}

function makeParams(id: string) {
	return { params: Promise.resolve({ id }) };
}

function mockAdminAuth() {
	auth.mockResolvedValueOnce({ user: { id: "admin-1" } });
	mockSelectLimit.mockResolvedValueOnce([{ role: "admin" }]);
}

function mockUserAuth() {
	auth.mockResolvedValueOnce({ user: { id: "user-1" } });
	mockSelectLimit.mockResolvedValueOnce([{ role: "user" }]);
}

describe("PATCH /api/categories/[id]", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 403 when not admin", async () => {
		mockUserAuth();
		const res = await PATCH(makeRequest({ name: "Japonais" }), makeParams(validUuid));
		expect(res.status).toBe(403);
	});

	it("updates category when admin", async () => {
		mockAdminAuth();
		mockUpdateWhere.mockResolvedValueOnce(undefined);

		const res = await PATCH(makeRequest({ name: "Japonais" }), makeParams(validUuid));

		expect(res.status).toBe(200);
		expect(mockUpdateSet).toHaveBeenCalledWith(
			expect.objectContaining({ name: "Japonais", slug: "japonais" }),
		);
		expect(revalidatePath).toHaveBeenCalledWith("/admin/categories");
		expect(revalidatePath).toHaveBeenCalledWith("/");
	});
});

describe("DELETE /api/categories/[id]", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 403 when not admin", async () => {
		mockUserAuth();
		const res = await DELETE(makeRequest({}, "DELETE"), makeParams(validUuid));
		expect(res.status).toBe(403);
	});

	it("deletes category and removes join table entries when admin", async () => {
		mockAdminAuth();
		mockDeleteWhere.mockResolvedValueOnce(undefined);
		mockDeleteWhere.mockResolvedValueOnce(undefined);

		const res = await DELETE(makeRequest({}, "DELETE"), makeParams(validUuid));

		expect(res.status).toBe(200);
		expect(mockDeleteWhere).toHaveBeenCalledTimes(2);
		expect(revalidatePath).toHaveBeenCalledWith("/admin/categories");
		expect(revalidatePath).toHaveBeenCalledWith("/");
	});
});
