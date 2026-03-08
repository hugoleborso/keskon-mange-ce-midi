import { RestaurantForm } from "@/components/restaurants/restaurant-form";
import * as m from "@/paraglide/messages.js";
import { createRestaurant } from "@/server/actions/restaurants";

export default function NewRestaurantPage() {
	return (
		<main className="mx-auto max-w-lg p-4">
			<h1 className="mb-6 text-2xl font-bold">{m.restaurants_add()}</h1>
			<RestaurantForm action={createRestaurant} />
		</main>
	);
}
