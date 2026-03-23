import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePlacesAutocomplete } from "./use-places-autocomplete";

describe("usePlacesAutocomplete", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
		global.fetch = vi.fn();
	});

	it("initializes with empty state", () => {
		const { result } = renderHook(() => usePlacesAutocomplete());

		expect(result.current.query).toBe("");
		expect(result.current.suggestions).toEqual([]);
		expect(result.current.isLoading).toBe(false);
	});

	it("does not fetch for queries shorter than 2 characters", () => {
		const { result } = renderHook(() => usePlacesAutocomplete());

		act(() => {
			result.current.setQuery("a");
		});

		vi.advanceTimersByTime(300);

		expect(global.fetch).not.toHaveBeenCalled();
	});

	it("fetches suggestions after debounce", async () => {
		const mockResponse = {
			suggestions: [
				{
					displayName: "Test Place",
					formattedAddress: "123 Test St",
					latitude: 48.85,
					longitude: 2.35,
				},
			],
		};
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve(mockResponse),
		});

		const { result } = renderHook(() => usePlacesAutocomplete());

		act(() => {
			result.current.setQuery("test place");
		});

		act(() => {
			vi.advanceTimersByTime(300);
		});

		vi.useRealTimers();

		await waitFor(() => {
			expect(result.current.suggestions).toHaveLength(1);
		});
	});

	it("handles missing suggestions in response", async () => {
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: () => Promise.resolve({}),
		});

		const { result } = renderHook(() => usePlacesAutocomplete());

		act(() => {
			result.current.setQuery("test place");
		});

		act(() => {
			vi.advanceTimersByTime(300);
		});

		vi.useRealTimers();

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.suggestions).toEqual([]);
	});

	it("handles fetch errors gracefully", async () => {
		(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));

		const { result } = renderHook(() => usePlacesAutocomplete());

		act(() => {
			result.current.setQuery("test place");
		});

		act(() => {
			vi.advanceTimersByTime(300);
		});

		vi.useRealTimers();

		await waitFor(() => {
			expect(result.current.isLoading).toBe(false);
		});

		expect(result.current.suggestions).toEqual([]);
	});

	it("clears suggestions", () => {
		const { result } = renderHook(() => usePlacesAutocomplete());

		act(() => {
			result.current.clear();
		});

		expect(result.current.query).toBe("");
		expect(result.current.suggestions).toEqual([]);
	});
});
