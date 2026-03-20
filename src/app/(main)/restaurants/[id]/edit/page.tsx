import { notFound } from "next/navigation";
import { RestaurantForm } from "@/components/restaurants/restaurant-form";
import * as m from "@/paraglide/messages.js";
import { updateRestaurant } from "@/server/actions/restaurants";
import { getRestaurantById } from "@/server/queries/restaurants";

export default async function EditRestaurantPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const restaurant = await getRestaurantById(id);

	if (!restaurant) notFound();

	return (
		<main className="mx-auto max-w-lg p-4">
			<h1 className="mb-6 text-2xl font-bold">{m.restaurant_edit()}</h1>
			<RestaurantForm action={updateRestaurant} restaurant={restaurant} />
		</main>
	);
}
