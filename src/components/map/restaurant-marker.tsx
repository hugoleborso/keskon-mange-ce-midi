"use client";

import L from "leaflet";
import { Marker } from "react-leaflet";
import type { RestaurantWithRating } from "@/server/queries/restaurants";
import { MapPopup } from "./map-popup";

function ratingColor(rating: number | null): string {
	if (rating === null) return "#94a3b8"; // grey for no ratings

	// Smooth gradient: 1=red, 2.5=orange, 3=yellow, 4=light green, 5=green
	const stops = [
		{ at: 1, r: 239, g: 68, b: 68 }, // red
		{ at: 2.5, r: 245, g: 158, b: 11 }, // orange/amber
		{ at: 3, r: 234, g: 179, b: 8 }, // yellow
		{ at: 4, r: 132, g: 204, b: 22 }, // lime
		{ at: 5, r: 34, g: 197, b: 94 }, // green
	];

	const clamped = Math.max(1, Math.min(5, rating));

	let lower = stops[0];
	let upper = stops[stops.length - 1];
	for (let i = 0; i < stops.length - 1; i++) {
		if (clamped >= stops[i].at && clamped <= stops[i + 1].at) {
			lower = stops[i];
			upper = stops[i + 1];
			break;
		}
	}

	const t = upper.at === lower.at ? 0 : (clamped - lower.at) / (upper.at - lower.at);
	const r = Math.round(lower.r + (upper.r - lower.r) * t);
	const g = Math.round(lower.g + (upper.g - lower.g) * t);
	const b = Math.round(lower.b + (upper.b - lower.b) * t);

	return `rgb(${r}, ${g}, ${b})`;
}

function createIcon(rating: number | null, isSelected: boolean, isHighlighted: boolean) {
	const color = ratingColor(rating);
	const label = rating !== null ? rating.toFixed(1) : "—";
	const size = isHighlighted ? 52 : isSelected ? 44 : 36;
	const fontSize = isHighlighted ? 15 : isSelected ? 13 : 11;
	const borderWidth = isHighlighted ? 4 : isSelected ? 3 : 2;

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
				${isHighlighted ? "transform: scale(1.3);" : isSelected ? "transform: scale(1.1);" : ""}
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
	isHighlighted = false,
	onSelect,
}: {
	restaurant: RestaurantWithRating;
	isSelected: boolean;
	isHighlighted?: boolean;
	onSelect: (id: string) => void;
}) {
	if (!restaurant.latitude || !restaurant.longitude) return null;

	const icon = createIcon(restaurant.averageRating, isSelected, isHighlighted);

	return (
		<Marker
			position={[restaurant.latitude, restaurant.longitude]}
			icon={icon}
			eventHandlers={{
				click: () => onSelect(restaurant.id),
			}}
			zIndexOffset={isHighlighted ? 2000 : isSelected ? 1000 : 0}
		>
			<MapPopup restaurant={restaurant} />
		</Marker>
	);
}
