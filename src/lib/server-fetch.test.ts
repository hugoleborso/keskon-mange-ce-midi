import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
	headers: vi.fn(),
	cookies: vi.fn(),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

type MockFn = ReturnType<typeof vi.fn>;

const { serverFetch } = await import("./server-fetch");
const { headers, cookies } = (await import("next/headers")) as unknown as {
	headers: MockFn;
	cookies: MockFn;
};

describe("serverFetch", () => {
	beforeEach(() => vi.clearAllMocks());

	it("constructs URL from host and x-forwarded-proto headers and forwards cookies", async () => {
		headers.mockResolvedValueOnce({
			get: (k: string) =>
				k === "host" ? "example.com" : k === "x-forwarded-proto" ? "https" : null,
		});
		cookies.mockResolvedValueOnce({ toString: () => "session=abc123" });
		mockFetch.mockResolvedValueOnce(new Response("ok"));

		await serverFetch("/api/test");

		expect(mockFetch).toHaveBeenCalledWith("https://example.com/api/test", {
			headers: { cookie: "session=abc123" },
			cache: "no-store",
		});
	});

	it("defaults to http://localhost:3000 when headers are absent", async () => {
		headers.mockResolvedValueOnce({ get: () => null });
		cookies.mockResolvedValueOnce({ toString: () => "" });
		mockFetch.mockResolvedValueOnce(new Response("ok"));

		await serverFetch("/api/test");

		expect(mockFetch).toHaveBeenCalledWith("http://localhost:3000/api/test", {
			headers: { cookie: "" },
			cache: "no-store",
		});
	});

	it("returns the fetch response", async () => {
		headers.mockResolvedValueOnce({ get: () => null });
		cookies.mockResolvedValueOnce({ toString: () => "" });
		const fakeResponse = new Response(JSON.stringify({ data: [] }));
		mockFetch.mockResolvedValueOnce(fakeResponse);

		const result = await serverFetch("/api/restaurants");

		expect(result).toBe(fakeResponse);
	});
});
