"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { geocodeAddress } from "@/lib/geocoding";
import { createRestaurantSchema, updateRestaurantSchema } from "@/lib/validations/restaurant";
import { auth } from "../auth";
import { db } from "../db";
import { restaurantCategories, restaurants } from "../db/schema";

function parseOptionalCoord(value: FormDataEntryValue | null): number | undefined {
	if (typeof value !== "string" || value === "") return undefined;
	const num = Number.parseFloat(value);
	return Number.isFinite(num) ? num : undefined;
}

export async function createRestaurant(formData: FormData) {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Non authentifie");

	const raw = {
		name: formData.get("name"),
		address: formData.get("address"),
		restaurantType: formData.get("restaurantType") || undefined,
		categoryIds: formData
			.getAll("categoryIds")
			.filter((v) => typeof v === "string" && v.length > 0),
		labels: formData.getAll("labels"),
		priceRange: formData.get("priceRange") || undefined,
		dineIn: formData.get("dineIn") === "on",
		takeAway: formData.get("takeAway") === "on",
	};

	const validated = createRestaurantSchema.parse(raw);

	const placeLat = parseOptionalCoord(formData.get("latitude"));
	const placeLng = parseOptionalCoord(formData.get("longitude"));

	let latitude: number;
	let longitude: number;

	if (placeLat !== undefined && placeLng !== undefined) {
		latitude = placeLat;
		longitude = placeLng;
	} else {
		const geo = await geocodeAddress(validated.address);
		if (!geo) throw new Error("Adresse introuvable");
		latitude = geo.latitude;
		longitude = geo.longitude;
	}

	const { categoryIds, ...restaurantData } = validated;

	const [restaurant] = await db
		.insert(restaurants)
		.values({
			...restaurantData,
			latitude,
			longitude,
			createdBy: session.user.id,
		})
		.returning({ id: restaurants.id });

	if (categoryIds.length > 0) {
		await db.insert(restaurantCategories).values(
			categoryIds.map((categoryId) => ({
				restaurantId: restaurant.id,
				categoryId,
			})),
		);
	}

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
		categoryIds: formData
			.getAll("categoryIds")
			.filter((v) => typeof v === "string" && v.length > 0),
		labels: formData.getAll("labels"),
		priceRange: formData.get("priceRange") || undefined,
		dineIn: formData.get("dineIn") === "on",
		takeAway: formData.get("takeAway") === "on",
		status: formData.get("status") || undefined,
	};

	const validated = updateRestaurantSchema.parse(raw);

	const placeLat = parseOptionalCoord(formData.get("latitude"));
	const placeLng = parseOptionalCoord(formData.get("longitude"));

	let latitude: number;
	let longitude: number;

	if (placeLat !== undefined && placeLng !== undefined) {
		latitude = placeLat;
		longitude = placeLng;
	} else {
		const geo = await geocodeAddress(validated.address);
		if (!geo) throw new Error("Adresse introuvable");
		latitude = geo.latitude;
		longitude = geo.longitude;
	}

	const { categoryIds, ...restaurantData } = validated;

	await db
		.update(restaurants)
		.set({
			...restaurantData,
			latitude,
			longitude,
			updatedAt: new Date(),
		})
		.where(eq(restaurants.id, validated.id));

	// Replace categories
	await db.delete(restaurantCategories).where(eq(restaurantCategories.restaurantId, validated.id));
	if (categoryIds.length > 0) {
		await db.insert(restaurantCategories).values(
			categoryIds.map((categoryId) => ({
				restaurantId: validated.id,
				categoryId,
			})),
		);
	}

	revalidatePath("/");
	revalidatePath(`/restaurants/${validated.id}`);
	redirect(`/restaurants/${validated.id}`);
}
