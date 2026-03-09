"use client";

import Link from "next/link";
import { Popup } from "react-leaflet";
import { PRICE_RANGE_LABELS } from "@/lib/constants";
import * as m from "@/paraglide/messages.js";
import type { RestaurantWithRating } from "@/server/queries/restaurants";

function StarDisplay({ rating }: { rating: number }) {
	const full = Math.floor(rating);
	const hasHalf = rating - full >= 0.25;
	const stars = [];

	for (let i = 0; i < 5; i++) {
		if (i < full) {
			stars.push(
				<span key={i} style={{ color: "#f59e0b" }}>
					&#9733;
				</span>,
			);
		} else if (i === full && hasHalf) {
			stars.push(
				<span key={i} style={{ color: "#f59e0b", opacity: 0.5 }}>
					&#9733;
				</span>,
			);
		} else {
			stars.push(
				<span key={i} style={{ color: "#d1d5db" }}>
					&#9733;
				</span>,
			);
		}
	}

	return <span style={{ letterSpacing: "1px" }}>{stars}</span>;
}

export function MapPopup({ restaurant }: { restaurant: RestaurantWithRating }) {
	return (
		<Popup closeButton={false} className="modern-popup">
			<div style={{ minWidth: 200, padding: "4px 0" }}>
				<Link
					href={`/restaurants/${restaurant.id}`}
					style={{
						fontSize: 15,
						fontWeight: 600,
						color: "#1e293b",
						textDecoration: "none",
						lineHeight: 1.3,
						display: "block",
					}}
				>
					{restaurant.name}
				</Link>

				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 6,
						marginTop: 6,
						fontSize: 12,
						color: "#64748b",
					}}
				>
					{restaurant.restaurantType && (
						<span
							style={{
								background: "#f1f5f9",
								padding: "2px 8px",
								borderRadius: 12,
								fontWeight: 500,
							}}
						>
							{restaurant.restaurantType}
						</span>
					)}
					{restaurant.priceRange && (
						<span
							style={{
								background: "#f1f5f9",
								padding: "2px 8px",
								borderRadius: 12,
								fontWeight: 500,
							}}
						>
							{PRICE_RANGE_LABELS[restaurant.priceRange]}
						</span>
					)}
				</div>

				<div style={{ marginTop: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
					{restaurant.reviewsCount > 0 && restaurant.averageRating !== null ? (
						<>
							<StarDisplay rating={restaurant.averageRating} />
							<span style={{ fontWeight: 600, color: "#334155" }}>
								{restaurant.averageRating.toFixed(1)}
							</span>
							<span style={{ color: "#94a3b8", fontSize: 12 }}>
								({m.restaurant_reviews({ count: restaurant.reviewsCount })})
							</span>
						</>
					) : (
						<span style={{ color: "#94a3b8", fontStyle: "italic" }}>
							{m.restaurant_no_reviews()}
						</span>
					)}
				</div>
			</div>
		</Popup>
	);
}
