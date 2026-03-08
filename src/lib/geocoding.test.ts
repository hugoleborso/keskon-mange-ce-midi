import { afterEach, describe, expect, it, vi } from "vitest";
import { geocodeAddress } from "./geocoding";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

afterEach(() => {
	vi.clearAllMocks();
});

describe("geocodeAddress", () => {
	it("returns coordinates for a valid address", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () =>
				Promise.resolve([{ lat: "48.8566", lon: "2.3522", display_name: "Paris, France" }]),
		});

		const result = await geocodeAddress("Paris");

		expect(result).toEqual({
			latitude: 48.8566,
			longitude: 2.3522,
			displayName: "Paris, France",
		});
		expect(mockFetch).toHaveBeenCalledOnce();
		const url = new URL(mockFetch.mock.calls[0][0]);
		expect(url.searchParams.get("q")).toBe("Paris");
		expect(url.searchParams.get("format")).toBe("json");
		expect(url.searchParams.get("limit")).toBe("1");
	});

	it("sends the correct User-Agent header", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve([{ lat: "0", lon: "0", display_name: "X" }]),
		});

		await geocodeAddress("test");

		const headers = mockFetch.mock.calls[0][1]?.headers;
		expect(headers).toEqual({ "User-Agent": "keskon-mange-ce-midi/1.0" });
	});

	it("returns null when the API returns no results", async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve([]),
		});

		const result = await geocodeAddress("nonexistent place xyz");
		expect(result).toBeNull();
	});

	it("returns null when the API returns a non-OK status", async () => {
		mockFetch.mockResolvedValueOnce({ ok: false });

		const result = await geocodeAddress("Paris");
		expect(result).toBeNull();
	});
});
