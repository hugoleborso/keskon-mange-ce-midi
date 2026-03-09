"use client";

import type { Map as LeafletMap } from "leaflet";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { useMapContext } from "@/hooks/use-map-context";
import type { RestaurantWithRating } from "@/server/queries/restaurants";
import { RestaurantMarker } from "./restaurant-marker";

const PARIS_CENTER = { lat: 48.866, lng: 2.333 };
const DEFAULT_ZOOM = 13;

export function MapInner({ restaurants }: { restaurants: RestaurantWithRating[] }) {
	const { selectedId, setSelectedId, registerMap } = useMapContext();
	const mapRef = useRef<LeafletMap | null>(null);

	useEffect(() => {
		if (mapRef.current) {
			registerMap(mapRef.current);
		}
	}, [registerMap]);

	useEffect(() => {
		const map = mapRef.current;
		if (!map || restaurants.length === 0) return;

		const geoRestaurants = restaurants.filter((r) => r.latitude && r.longitude);
		if (geoRestaurants.length === 0) return;

		const bounds = geoRestaurants.map((r) => [r.latitude, r.longitude] as [number, number]);

		map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
	}, [restaurants]);

	return (
		<MapContainer center={PARIS_CENTER} zoom={DEFAULT_ZOOM} className="h-full w-full" ref={mapRef}>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
				url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			/>
			{restaurants.map((restaurant) => (
				<RestaurantMarker
					key={restaurant.id}
					restaurant={restaurant}
					isSelected={selectedId === restaurant.id}
					onSelect={setSelectedId}
				/>
			))}
		</MapContainer>
	);
}
