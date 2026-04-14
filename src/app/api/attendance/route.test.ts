import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("@/server/queries/attendance", () => ({
	getTodayDateString: vi.fn(() => "2026-03-23"),
	getRestaurantAttendance: vi.fn(),
}));

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
	lunchAttendance: { userId: "user_id", restaurantId: "restaurant_id", date: "date" },
}));

type MockFn = ReturnType<typeof vi.fn>;

const { GET, POST } = await import("./route");
const { auth } = (await import("@/server/auth")) as unknown as { auth: MockFn };
const { revalidatePath } = (await import("next/cache")) as unknown as {
	revalidatePath: MockFn;
};
const { getRestaurantAttendance } = (await import("@/server/queries/attendance")) as unknown as {
	getRestaurantAttendance: MockFn;
};

const validRestaurantId = "550e8400-e29b-41d4-a716-446655440000";
const otherRestaurantId = "660e8400-e29b-41d4-a716-446655440000";

function makeRequest(body: unknown): NextRequest {
	return new Request("http://localhost", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	}) as unknown as NextRequest;
}

describe("POST /api/attendance", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 401 when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);
		const res = await POST(makeRequest({ restaurantId: validRestaurantId }));
		expect(res.status).toBe(401);
	});

	it("returns 400 on invalid input", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		const res = await POST(makeRequest({ restaurantId: "not-a-uuid" }));
		expect(res.status).toBe(400);
	});

	it("creates new attendance when none exists", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([]);
		mockInsertValues.mockResolvedValueOnce(undefined);

		const res = await POST(makeRequest({ restaurantId: validRestaurantId }));

		expect(res.status).toBe(200);
		expect(mockInsertValues).toHaveBeenCalledWith({
			userId: "user-1",
			restaurantId: validRestaurantId,
			date: "2026-03-23",
		});
		expect(revalidatePath).toHaveBeenCalledWith("/");
	});

	it("removes attendance when toggling same restaurant", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([{ restaurantId: validRestaurantId }]);
		mockDeleteWhere.mockResolvedValueOnce(undefined);

		const res = await POST(makeRequest({ restaurantId: validRestaurantId }));

		expect(res.status).toBe(200);
		expect(mockDeleteWhere).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith("/");
	});

	it("switches restaurant when attending a different one", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([{ restaurantId: otherRestaurantId }]);
		mockUpdateWhere.mockResolvedValueOnce(undefined);

		const res = await POST(makeRequest({ restaurantId: validRestaurantId }));

		expect(res.status).toBe(200);
		expect(mockUpdateSet).toHaveBeenCalledWith({ restaurantId: validRestaurantId });
		expect(revalidatePath).toHaveBeenCalledWith("/");
	});
});

describe("GET /api/attendance", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 401 when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);
		const res = await GET(
			new Request(
				`http://localhost/api/attendance?restaurantId=${validRestaurantId}`,
			) as unknown as NextRequest,
		);
		expect(res.status).toBe(401);
	});

	it("returns 400 when restaurantId is missing", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		const res = await GET(new Request("http://localhost/api/attendance") as unknown as NextRequest);
		expect(res.status).toBe(400);
	});

	it("returns attendance list on success", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		getRestaurantAttendance.mockResolvedValueOnce([{ userId: "u1", name: "Alice", image: null }]);

		const res = await GET(
			new Request(
				`http://localhost/api/attendance?restaurantId=${validRestaurantId}`,
			) as unknown as NextRequest,
		);

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data).toEqual([{ userId: "u1", name: "Alice", image: null }]);
		expect(getRestaurantAttendance).toHaveBeenCalledWith(validRestaurantId, "2026-03-23");
	});

	it("uses provided date param", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		getRestaurantAttendance.mockResolvedValueOnce([]);

		await GET(
			new Request(
				`http://localhost/api/attendance?restaurantId=${validRestaurantId}&date=2026-04-01`,
			) as unknown as NextRequest,
		);

		expect(getRestaurantAttendance).toHaveBeenCalledWith(validRestaurantId, "2026-04-01");
	});
});
