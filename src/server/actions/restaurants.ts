"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { geocodeAddress } from "@/lib/geocoding";
import { createRestaurantSchema, updateRestaurantSchema } from "@/lib/validations/restaurant";
import { auth } from "../auth";
import { db } from "../db";
import { restaurants } from "../db/schema";

export async function createRestaurant(formData: FormData) {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Non authentifie");

	const raw = {
		name: formData.get("name"),
		address: formData.get("address"),
		restaurantType: formData.get("restaurantType") || undefined,
		labels: formData.getAll("labels"),
		priceRange: formData.get("priceRange") || undefined,
		dineIn: formData.get("dineIn") === "on",
		takeAway: formData.get("takeAway") === "on",
	};

	const validated = createRestaurantSchema.parse(raw);

	const geo = await geocodeAddress(validated.address);
	if (!geo) throw new Error("Adresse introuvable");

	const [restaurant] = await db
		.insert(restaurants)
		.values({
			...validated,
			latitude: geo.latitude,
			longitude: geo.longitude,
			createdBy: session.user.id,
		})
		.returning({ id: restaurants.id });

	revalidatePath("/");
	redirect(`/restaurants/${restaurant.id}`);
}

export async function updateRestaurant(formData: FormData) {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Non authentifie");

	const raw = {
		id: formData.get("id"),
		name: formData.get("name"),
		address: formData.get("address"),
		restaurantType: formData.get("restaurantType") || undefined,
		labels: formData.getAll("labels"),
		priceRange: formData.get("priceRange") || undefined,
		dineIn: formData.get("dineIn") === "on",
		takeAway: formData.get("takeAway") === "on",
		status: formData.get("status") || undefined,
	};

	const validated = updateRestaurantSchema.parse(raw);

	const geo = await geocodeAddress(validated.address);
	if (!geo) throw new Error("Adresse introuvable");

	await db
		.update(restaurants)
		.set({
			...validated,
			latitude: geo.latitude,
			longitude: geo.longitude,
			updatedAt: new Date(),
		})
		.where(eq(restaurants.id, validated.id));

	revalidatePath("/");
	revalidatePath(`/restaurants/${validated.id}`);
	redirect(`/restaurants/${validated.id}`);
}
