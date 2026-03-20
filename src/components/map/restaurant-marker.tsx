"use client";

import L from "leaflet";
import { Marker } from "react-leaflet";
import type { RestaurantWithRating } from "@/server/queries/restaurants";
import { MapPopup } from "./map-popup";

function ratingColor(rating: number | null): string {
	if (rating === null) return "#94a3b8"; // slate-400
	if (rating >= 4) return "#10b981"; // emerald-500
	if (rating >= 3) return "#f59e0b"; // amber-500
	return "#ef4444"; // red-500
}

function createIcon(rating: number | null, isSelected: boolean) {
	const color = ratingColor(rating);
	const label = rating !== null ? rating.toFixed(1) : "—";
	const size = isSelected ? 44 : 36;
	const fontSize = isSelected ? 13 : 11;
	const borderWidth = isSelected ? 3 : 2;

	return L.divIcon({
		className: "",
		iconSize: [size, size + 8],
		iconAnchor: [size / 2, size + 8],
		popupAnchor: [0, -(size + 4)],
		html: `<div style="
			display: flex;
			flex-direction: column;
			align-items: center;
			filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
		">
			<div style="
				background: ${color};
				color: white;
				width: ${size}px;
				height: ${size}px;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				border: ${borderWidth}px solid white;
				font-size: ${fontSize}px;
				font-weight: 700;
				font-family: system-ui, sans-serif;
				letter-spacing: -0.02em;
				transition: transform 0.2s ease;
				${isSelected ? "transform: scale(1.1);" : ""}
			">${label}</div>
			<div style="
				width: 0;
				height: 0;
				border-left: 6px solid transparent;
				border-right: 6px solid transparent;
				border-top: 8px solid white;
				margin-top: -1px;
			"></div>
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

	const icon = createIcon(restaurant.averageRating, isSelected);

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
