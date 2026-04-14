import { RestaurantFormClient } from "@/components/restaurants/restaurant-form-client";
import { serverFetch } from "@/lib/server-fetch";
import * as m from "@/paraglide/messages.js";

export default async function NewRestaurantPage() {
	const res = await serverFetch("/api/categories");
	const { data: categories } = (await res.json()) as {
		data: { id: string; name: string; slug: string }[];
	};

	return (
		<main className="mx-auto max-w-lg p-4">
			<h1 className="mb-6 text-2xl font-bold">{m.restaurants_add()}</h1>
			<RestaurantFormClient categories={categories} />
		</main>
	);
}
