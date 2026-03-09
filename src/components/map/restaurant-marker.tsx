"use client";

import L from "leaflet";
import { Marker } from "react-leaflet";
import type { RestaurantWithRating } from "@/server/queries/restaurants";
import { MapPopup } from "./map-popup";

function ratingColor(rating: number | null): string {
	if (rating === null) return "#9ca3af"; // gray
	if (rating >= 4) return "#22c55e"; // green
	if (rating >= 3) return "#f59e0b"; // orange
	return "#ef4444"; // red
}

function createIcon(rating: number | null) {
	const color = ratingColor(rating);
	const label = rating !== null ? rating.toFixed(1) : "?";

	return L.divIcon({
		className: "",
		iconSize: [32, 32],
		iconAnchor: [16, 32],
		popupAnchor: [0, -32],
		html: `<div style="
			background: ${color};
			color: white;
			width: 32px;
			height: 32px;
			border-radius: 50% 50% 50% 0;
			transform: rotate(-45deg);
			display: flex;
			align-items: center;
			justify-content: center;
			border: 2px solid white;
			box-shadow: 0 2px 4px rgba(0,0,0,0.3);
		">
			<span style="transform: rotate(45deg); font-size: 11px; font-weight: 600;">${label}</span>
		</div>`,
	});
}

export function RestaurantMarker({
	restaurant,
	isSelected,
	onSelect,
}: {
	restaurant: RestaurantWithRating;
	isSelected: boolean;
	onSelect: (id: string) => void;
}) {
	if (!restaurant.latitude || !restaurant.longitude) return null;

	const icon = createIcon(restaurant.averageRating);

	return (
		<Marker
			position={[restaurant.latitude, restaurant.longitude]}
			icon={icon}
			eventHandlers={{
				click: () => onSelect(restaurant.id),
			}}
			zIndexOffset={isSelected ? 1000 : 0}
		>
			<MapPopup restaurant={restaurant} />
		</Marker>
	);
}
