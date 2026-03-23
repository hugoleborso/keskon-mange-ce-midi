"use client";

import type { ReactNode } from "react";
import { useMapContext } from "@/hooks/use-map-context";

export function RestaurantCardWrapper({
	restaurantId,
	children,
}: {
	restaurantId: string;
	children: ReactNode;
}) {
	const { setHighlightedId } = useMapContext();

	const handleMouseEnter = () => setHighlightedId(restaurantId);
	const handleMouseLeave = () => setHighlightedId(null);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: hover highlight is visual-only
		<div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
			{children}
		</div>
	);
}
