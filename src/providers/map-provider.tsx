"use client";

import { type ReactNode, createContext, useCallback, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";

export type MapContextValue = {
	selectedId: string | null;
	setSelectedId: (id: string | null) => void;
	flyTo: (lat: number, lng: number, zoom?: number) => void;
	registerMap: (map: LeafletMap) => void;
};

export const MapContext = createContext<MapContextValue | null>(null);

export function MapProvider({ children }: { children: ReactNode }) {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const mapRef = useRef<LeafletMap | null>(null);

	const registerMap = useCallback((map: LeafletMap) => {
		mapRef.current = map;
	}, []);

	const flyTo = useCallback((lat: number, lng: number, zoom = 16) => {
		mapRef.current?.flyTo([lat, lng], zoom, { duration: 1 });
	}, []);

	return (
		<MapContext value={{ selectedId, setSelectedId, flyTo, registerMap }}>
			{children}
		</MapContext>
	);
}
