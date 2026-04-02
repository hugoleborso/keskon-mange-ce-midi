import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth", () => ({ auth: vi.fn() }));
vi.mock("@/server/queries/attendance", () => ({
	getUserAttendance: vi.fn(),
	getTodayDateString: vi.fn(() => "2026-04-02"),
}));

type MockFn = ReturnType<typeof vi.fn>;

const { GET } = await import("./route");
const { auth } = (await import("@/server/auth")) as unknown as { auth: MockFn };
const { getUserAttendance } = (await import("@/server/queries/attendance")) as unknown as {
	getUserAttendance: MockFn;
};

describe("GET /api/attendance/me", () => {
	beforeEach(() => vi.clearAllMocks());

	it("returns 401 when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);
		const res = await GET(
			new Request("http://localhost/api/attendance/me") as unknown as NextRequest,
		);
		expect(res.status).toBe(401);
	});

	it("returns restaurantId when user has attendance", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		getUserAttendance.mockResolvedValueOnce("r-1");

		const res = await GET(
			new Request("http://localhost/api/attendance/me") as unknown as NextRequest,
		);

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data).toBe("r-1");
		expect(getUserAttendance).toHaveBeenCalledWith("user-1", "2026-04-02");
	});

	it("returns null when user has no attendance", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		getUserAttendance.mockResolvedValueOnce(null);

		const res = await GET(
			new Request("http://localhost/api/attendance/me") as unknown as NextRequest,
		);

		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.data).toBeNull();
	});

	it("uses provided date param", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		getUserAttendance.mockResolvedValueOnce(null);

		await GET(
			new Request("http://localhost/api/attendance/me?date=2026-03-01") as unknown as NextRequest,
		);

		expect(getUserAttendance).toHaveBeenCalledWith("user-1", "2026-03-01");
	});
});
