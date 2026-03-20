"use client";

import type { Map as LeafletMap } from "leaflet";
import { useEffect, useRef } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { useMapContext } from "@/hooks/use-map-context";
import type { RestaurantWithRating } from "@/server/queries/restaurants";
import { RestaurantMarker } from "./restaurant-marker";

const DEFAULT_CENTER = { lat: 48.8834, lng: 2.3244 }; // 48 boulevard des Batignolles, 75017
const DEFAULT_ZOOM = 15; // ~1km radius

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
		<MapContainer
			center={DEFAULT_CENTER}
			zoom={DEFAULT_ZOOM}
			className="h-full w-full"
			ref={mapRef}
		>
			<TileLayer
				attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
				url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
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
