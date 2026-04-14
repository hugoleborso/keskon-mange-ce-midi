import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("@/server/queries/categories", () => ({
	getCategories: vi.fn(),
}));

const mockInsertValues = vi.fn();
const mockSelectLimit = vi.fn();
const mockSelectWhere = vi.fn(() => ({ limit: mockSelectLimit }));
const mockSelectFrom = vi.fn(() => ({ where: mockSelectWhere }));

vi.mock("@/server/db", () => ({
	db: {
		insert: vi.fn(() => ({ values: mockInsertValues })),
		select: vi.fn(() => ({ from: mockSelectFrom })),
	},
}));

vi.mock("@/server/db/schema", () => ({
	categories: { id: "id", name: "name" },
	users: { id: "id", role: "role" },
}));

type MockFn = ReturnType<typeof vi.fn>;

const { GET, POST } = await import("./route");
const { auth } = (await import("@/server/auth")) as unknown as { auth: MockFn };
const { revalidatePath } = (await import("next/cache")) as unknown as {
	revalidatePath: MockFn;
};
const { getCategories } = (await import("@/server/queries/categories")) as unknown as {
	getCategories: MockFn;
};

function makeRequest(body: unknown): NextRequest {
	return new Request("http://localhost", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	}) as unknown as NextRequest;
}

function mockAdminAuth() {
	auth.mockResolvedValueOnce({ user: { id: "admin-1" } });
	mockSelectLimit.mockResolvedValueOnce([{ role: "admin" }]);
}

function mockUserAuth() {
	auth.mockResolvedValueOnce({ user: { id: "user-1" } });
	mockSelectLimit.mockResolvedValueOnce([{ role: "user" }]);
}

describe("POST /api/categories", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 403 when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);
		const res = await POST(makeRequest({ name: "Italien" }));
		expect(res.status).toBe(403);
	});

	it("returns 403 when not admin", async () => {
		mockUserAuth();
		const res = await POST(makeRequest({ name: "Italien" }));
		expect(res.status).toBe(403);
	});

	it("returns 400 on invalid input", async () => {
		mockAdminAuth();
		const res = await POST(makeRequest({ name: "" }));
		expect(res.status).toBe(400);
	});

	it("creates category when admin", async () => {
		mockAdminAuth();
		mockInsertValues.mockResolvedValueOnce(undefined);

		const res = await POST(makeRequest({ name: "Italien" }));

		expect(res.status).toBe(201);
		expect(mockInsertValues).toHaveBeenCalledWith(
			expect.objectContaining({ name: "Italien", slug: "italien" }),
		);
		expect(revalidatePath).toHaveBeenCalledWith("/admin/categories");
		expect(revalidatePath).toHaveBeenCalledWith("/");
	});
});

describe("GET /api/categories", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 401 when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);
		const res = await GET(new Request("http://localhost/api/categories") as unknown as NextRequest);
		expect(res.status).toBe(401);
	});

	it("returns categories on success", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		getCategories.mockResolvedValueOnce([{ id: "cat-1", name: "Italien" }]);

		const res = await GET(new Request("http://localhost/api/categories") as unknown as NextRequest);

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data).toEqual([{ id: "cat-1", name: "Italien" }]);
	});
});
