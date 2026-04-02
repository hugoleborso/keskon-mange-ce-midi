"use client";

import { Heart } from "lucide-react";
import { useOptimistic, useTransition } from "react";

export function FavoriteButton({
	restaurantId,
	isFavorite,
}: {
	restaurantId: string;
	isFavorite: boolean;
}) {
	const [optimisticFavorite, setOptimisticFavorite] = useOptimistic(isFavorite);
	const [isPending, startTransition] = useTransition();

	const handleToggle = () => {
		startTransition(async () => {
			setOptimisticFavorite(!optimisticFavorite);
			await fetch("/api/favorites", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ restaurantId }),
			});
		});
	};

	return (
		<button
			type="button"
			disabled={isPending}
			onClick={(e) => {
				e.preventDefault();
				handleToggle();
			}}
			aria-label={optimisticFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
			className="p-1 disabled:pointer-events-none"
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
