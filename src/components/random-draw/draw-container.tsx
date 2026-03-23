"use client";

import { useCallback, useMemo, useState } from "react";
import { useMapContext } from "@/hooks/use-map-context";
import * as m from "@/paraglide/messages.js";
import type { RestaurantWithRating } from "@/server/queries/restaurants";
import { DrawAnimation } from "./draw-animation";
import { DrawButton } from "./draw-button";
import { DrawResult } from "./draw-result";

type DrawState = "idle" | "animating" | "result";

function shuffle<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

export function DrawContainer({
	restaurants,
	userAttendingId,
	isAuthenticated,
}: {
	restaurants: RestaurantWithRating[];
	userAttendingId?: string | null;
	isAuthenticated?: boolean;
}) {
	const [state, setState] = useState<DrawState>("idle");
	const [winner, setWinner] = useState<RestaurantWithRating | null>(null);
	const { flyTo, setSelectedId, setHighlightedId } = useMapContext();

	const shuffledNames = useMemo(() => shuffle(restaurants.map((r) => r.name)), [restaurants]);

	const nameToId = useMemo(() => {
		const map = new Map<string, string>();
		for (const r of restaurants) {
			map.set(r.name, r.id);
		}
		return map;
	}, [restaurants]);

	const startDraw = useCallback(() => {
		if (restaurants.length === 0) return;

		const randomIndex = Math.floor(Math.random() * restaurants.length);
		setWinner(restaurants[randomIndex]);
		setState("animating");
	}, [restaurants]);

	const handleCurrentNameChange = useCallback(
		(name: string) => {
			const id = nameToId.get(name);
			if (id) {
				setHighlightedId(id);
			}
		},
		[nameToId, setHighlightedId],
	);

	const handleAnimationComplete = useCallback(() => {
		setState("result");
		setHighlightedId(null);
		if (winner?.latitude && winner?.longitude) {
			flyTo(winner.latitude, winner.longitude);
			setSelectedId(winner.id);
		}
	}, [winner, flyTo, setSelectedId, setHighlightedId]);

	const handleRedraw = useCallback(() => {
		setState("idle");
		setWinner(null);
		setHighlightedId(null);
	}, [setHighlightedId]);

	if (restaurants.length === 0) {
		return (
			<div className="rounded-xl border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
				{m.draw_empty()}
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{state === "idle" && <DrawButton onDraw={startDraw} disabled={restaurants.length === 0} />}
			{state === "animating" && (
				<DrawAnimation
					names={shuffledNames}
					onComplete={handleAnimationComplete}
					onCurrentNameChange={handleCurrentNameChange}
				/>
			)}
			{state === "result" && winner && (
				<DrawResult
					restaurant={winner}
					onRedraw={handleRedraw}
					userAttendingId={userAttendingId}
					isAuthenticated={isAuthenticated}
				/>
			)}
		</div>
	);
}
