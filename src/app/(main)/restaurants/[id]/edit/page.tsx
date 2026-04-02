import { notFound } from "next/navigation";
import { RestaurantFormClient } from "@/components/restaurants/restaurant-form-client";
import { serverFetch } from "@/lib/server-fetch";
import * as m from "@/paraglide/messages.js";
import type { RestaurantWithRating } from "@/server/queries/restaurants";

export default async function EditRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const [restaurantRes, categoriesRes, catIdsRes] = await Promise.all([
		serverFetch(`/api/restaurants/${id}`),
		serverFetch("/api/categories"),
		serverFetch(`/api/restaurants/${id}/categories`),
	]);

	if (!restaurantRes.ok) notFound();

	const { data: restaurant } = (await restaurantRes.json()) as { data: RestaurantWithRating };
	const { data: categories } = (await categoriesRes.json()) as {
		data: { id: string; name: string; slug: string }[];
	};
	const { data: selectedCategoryIds } = (await catIdsRes.json()) as { data: string[] };

	return (
		<main className="mx-auto max-w-lg p-4">
			<h1 className="mb-6 text-2xl font-bold">{m.restaurant_edit()}</h1>
			<RestaurantFormClient
				restaurant={restaurant}
				categories={categories}
				selectedCategoryIds={selectedCategoryIds}
			/>
		</main>
	);
}
