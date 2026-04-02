import { notFound } from "next/navigation";
import { RestaurantFormClient } from "@/components/restaurants/restaurant-form-client";
import * as m from "@/paraglide/messages.js";
import { getCategories } from "@/server/queries/categories";
import { getRestaurantById, getRestaurantCategoryIds } from "@/server/queries/restaurants";

export default async function EditRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const [restaurant, categories, selectedCategoryIds] = await Promise.all([
		getRestaurantById(id),
		getCategories(),
		getRestaurantCategoryIds(id),
	]);

	if (!restaurant) notFound();

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
