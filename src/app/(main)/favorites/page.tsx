import Link from "next/link";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { RestaurantCard } from "@/components/restaurants/restaurant-card";
import * as m from "@/paraglide/messages.js";
import { auth } from "@/server/auth";
import { getUserFavoriteRestaurants } from "@/server/queries/favorites";

export default async function FavoritesPage() {
	const session = await auth();
	if (!session?.user?.id) return null;

	const restaurants = await getUserFavoriteRestaurants(session.user.id);

	return (
		<main className="mx-auto max-w-2xl p-4">
			<h1 className="mb-4 text-2xl font-bold">{m.favorites_title()}</h1>
			{restaurants.length === 0 ? (
				<div className="flex flex-col items-center gap-4 py-12 text-center">
					<p className="text-muted-foreground">{m.favorites_empty()}</p>
					<Link href="/" className="text-primary hover:underline">
						{m.favorites_empty_cta()}
					</Link>
				</div>
			) : (
				<div className="grid gap-3">
					{restaurants.map((restaurant) => (
						<RestaurantCard
							key={restaurant.id}
							restaurant={restaurant}
							favoriteButton={<FavoriteButton restaurantId={restaurant.id} isFavorite />}
						/>
					))}
				</div>
			)}
		</main>
	);
}
