import dynamic from "next/dynamic";
import type { RestaurantWithRating } from "@/server/queries/restaurants";

const MapInner = dynamic(() => import("./map-inner").then((mod) => mod.MapInner), {
	ssr: false,
	loading: () => (
		<div className="flex h-full w-full items-center justify-center bg-muted">
			<div className="text-sm text-muted-foreground">Chargement de la carte...</div>
		</div>
	),
});

export function RestaurantMap({ restaurants }: { restaurants: RestaurantWithRating[] }) {
	return <MapInner restaurants={restaurants} />;
}
