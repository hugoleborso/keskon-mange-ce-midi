import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { MapProvider } from "@/providers/map-provider";
import { useMapContext } from "./use-map-context";

function wrapper({ children }: { children: ReactNode }) {
	return createElement(MapProvider, null, children);
}

describe("useMapContext", () => {
	it("returns context value when used within MapProvider", () => {
		const { result } = renderHook(() => useMapContext(), { wrapper });

		expect(result.current).toHaveProperty("selectedId");
		expect(result.current).toHaveProperty("setSelectedId");
		expect(result.current).toHaveProperty("flyTo");
		expect(result.current).toHaveProperty("registerMap");
		expect(result.current.selectedId).toBeNull();
	});

	it("throws when used outside MapProvider", () => {
		// Suppress console.error for expected error
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(() => {
			renderHook(() => useMapContext());
		}).toThrow("useMapContext must be used within a MapProvider");

		spy.mockRestore();
	});
});
