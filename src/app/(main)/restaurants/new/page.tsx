import { RestaurantFormClient } from "@/components/restaurants/restaurant-form-client";
import * as m from "@/paraglide/messages.js";
import { createRestaurant } from "@/server/actions/restaurants";
import { getCategories } from "@/server/queries/categories";

export default async function NewRestaurantPage() {
	const categories = await getCategories();

	return (
		<main className="mx-auto max-w-lg p-4">
			<h1 className="mb-6 text-2xl font-bold">{m.restaurants_add()}</h1>
			<RestaurantFormClient action={createRestaurant} categories={categories} />
		</main>
	);
}
