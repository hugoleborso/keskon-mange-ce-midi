"use client";

import { Heart } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toggleFavorite } from "@/server/actions/favorites";

export function FavoriteButton({
	restaurantId,
	isFavorite,
}: {
	restaurantId: string;
	isFavorite: boolean;
}) {
	const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(isFavorite);
	const [, startTransition] = useTransition();

	const handleToggle = () => {
		startTransition(async () => {
			setOptimisticFavorite(!optimisticFavorite);
			await toggleFavorite(restaurantId);
		});
	};

	return (
		<button
			type="button"
			onClick={(e) => {
				e.preventDefault();
				handleToggle();
			}}
			aria-label={optimisticFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
			className="p-1"
		>
			<Heart
				className={`h-5 w-5 transition-colors ${
					optimisticFavorite
						? "fill-red-500 text-red-500"
						: "fill-none text-muted-foreground hover:text-red-400"
				}`}
			/>
		</button>
	);
}
