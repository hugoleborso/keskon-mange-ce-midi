import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-auth/jwt", () => ({ encode: vi.fn() }));

const mockOnConflictDoNothing = vi.fn();
const mockValues = vi.fn(() => ({ onConflictDoNothing: mockOnConflictDoNothing }));

vi.mock("@/server/db", () => ({
	db: { insert: vi.fn(() => ({ values: mockValues })) },
}));

vi.mock("@/server/db/schema", () => ({
	users: {},
	restaurants: {},
	favorites: {},
}));

type MockFn = ReturnType<typeof vi.fn>;

const { GET } = await import("./route");
const { encode } = (await import("next-auth/jwt")) as unknown as { encode: MockFn };

function makeRequest(): NextRequest {
	return new Request("http://localhost/api/auth/test-login") as unknown as NextRequest;
}

describe("GET /api/auth/test-login", () => {
	const originalFlag = process.env.E2E_TEST;

	beforeEach(() => vi.clearAllMocks());
	afterEach(() => {
		process.env.E2E_TEST = originalFlag;
	});

	it("returns 404 when the E2E_TEST flag is not set (production is protected)", async () => {
		process.env.E2E_TEST = undefined;
		const res = await GET(makeRequest());
		expect(res.status).toBe(404);
		expect(encode).not.toHaveBeenCalled();
	});

	it("seeds data, mints a session cookie and redirects to /favorites when enabled", async () => {
		process.env.E2E_TEST = "1";
		process.env.AUTH_SECRET = "test-secret";
		encode.mockResolvedValueOnce("signed-token");

		const res = await GET(makeRequest());

		// Seeds user + restaurant + favorite.
		expect(mockOnConflictDoNothing).toHaveBeenCalledTimes(3);
		// Redirects to the favorites page.
		expect(res.status).toBe(307);
		expect(res.headers.get("location")).toContain("/favorites");
		// Sets the Auth.js session cookie.
		expect(res.headers.get("set-cookie")).toContain("authjs.session-token=signed-token");
	});
});
