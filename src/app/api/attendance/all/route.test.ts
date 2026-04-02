import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("@/server/queries/attendance", () => ({
	getAllAttendanceForDate: vi.fn(),
	getTodayDateString: vi.fn(() => "2026-04-02"),
}));

type MockFn = ReturnType<typeof vi.fn>;

const { GET } = await import("./route");
const { auth } = (await import("@/server/auth")) as unknown as { auth: MockFn };
const { getAllAttendanceForDate } = (await import("@/server/queries/attendance")) as unknown as {
	getAllAttendanceForDate: MockFn;
};

describe("GET /api/attendance/all", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 401 when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);
		const res = await GET(
			new Request("http://localhost/api/attendance/all") as unknown as NextRequest,
		);
		expect(res.status).toBe(401);
	});

	it("returns attendance map for today by default", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		const map = new Map([["r-1", [{ userId: "u1", name: "Alice", image: null }]]]);
		getAllAttendanceForDate.mockResolvedValueOnce(map);

		const res = await GET(
			new Request("http://localhost/api/attendance/all") as unknown as NextRequest,
		);

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data).toEqual({ "r-1": [{ userId: "u1", name: "Alice", image: null }] });
		expect(getAllAttendanceForDate).toHaveBeenCalledWith("2026-04-02");
	});

	it("uses provided date param", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		getAllAttendanceForDate.mockResolvedValueOnce(new Map());

		await GET(
			new Request("http://localhost/api/attendance/all?date=2026-03-01") as unknown as NextRequest,
		);

		expect(getAllAttendanceForDate).toHaveBeenCalledWith("2026-03-01");
	});

	it("returns empty object when no attendance", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		getAllAttendanceForDate.mockResolvedValueOnce(new Map());

		const res = await GET(
			new Request("http://localhost/api/attendance/all") as unknown as NextRequest,
		);

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data).toEqual({});
	});
});
