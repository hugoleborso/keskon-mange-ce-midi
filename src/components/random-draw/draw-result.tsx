"use client";

import confetti from "canvas-confetti";
import Link from "next/link";
import { useEffect } from "react";
import { AttendanceButton } from "@/components/attendance/attendance-button";
import { NavigateButton } from "@/components/restaurants/navigate-button";
import { PRICE_RANGE_LABELS } from "@/lib/constants";
import * as m from "@/paraglide/messages.js";
import type { RestaurantWithRating } from "@/server/queries/restaurants";

export function DrawResult({
	restaurant,
	onRedraw,
	userAttendingId,
	isAuthenticated,
}: {
	restaurant: RestaurantWithRating;
	onRedraw: () => void;
	userAttendingId?: string | null;
	isAuthenticated?: boolean;
}) {
	useEffect(() => {
		const duration = 1500;
		const end = Date.now() + duration;

		const frame = () => {
			confetti({
				particleCount: 3,
				angle: 60,
				spread: 55,
				origin: { x: 0, y: 0.7 },
				colors: ["#ff6b6b", "#feca57", "#48dbfb", "#ff9ff3", "#54a0ff"],
			});
			confetti({
				particleCount: 3,
				angle: 120,
				spread: 55,
				origin: { x: 1, y: 0.7 },
				colors: ["#ff6b6b", "#feca57", "#48dbfb", "#ff9ff3", "#54a0ff"],
			});

			if (Date.now() < end) {
				requestAnimationFrame(frame);
			}
		};

		frame();
	}, []);

	return (
		<div className="animate-in fade-in zoom-in-95 space-y-3 rounded-xl border-2 border-primary bg-card p-4 shadow-lg duration-300">
			<div className="text-center">
				<p className="text-sm font-medium text-primary">{m.draw_destiny_spoke()}</p>
				<h3 className="mt-1 text-2xl font-bold">{restaurant.name}</h3>
				<div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
					{restaurant.restaurantType && <span>{restaurant.restaurantType}</span>}
					{restaurant.priceRange && (
						<>
							{restaurant.restaurantType && <span>·</span>}
							<span>{PRICE_RANGE_LABELS[restaurant.priceRange]}</span>
						</>
					)}
					{restaurant.reviewsCount > 0 && (
						<>
							<span>·</span>
							<span>{`⭐ ${restaurant.averageRating?.toFixed(1)}`}</span>
						</>
					)}
				</div>
			</div>
			<div className="flex flex-wrap items-center justify-center gap-2">
				{isAuthenticated && (
					<AttendanceButton
						restaurantId={restaurant.id}
						isAttending={userAttendingId === restaurant.id}
						isAttendingOther={
							userAttendingId !== null &&
							userAttendingId !== undefined &&
							userAttendingId !== restaurant.id
						}
						attendees={[]}
					/>
				)}
				{restaurant.latitude && restaurant.longitude && (
					<NavigateButton latitude={restaurant.latitude} longitude={restaurant.longitude} />
				)}
			</div>
			<div className="flex gap-2">
				<Link
					href={`/restaurants/${restaurant.id}`}
					className="flex-1 rounded-lg border px-4 py-2 text-center text-sm hover:bg-muted"
				>
					{m.draw_view_restaurant()}
				</Link>
				<button
					type="button"
					onClick={onRedraw}
					className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
				>
					{m.draw_retry()}
				</button>
			</div>
		</div>
	);
}
