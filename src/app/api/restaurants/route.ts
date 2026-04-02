import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { geocodeAddress } from "@/lib/geocoding";
import { createRestaurantSchema } from "@/lib/validations/restaurant";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { restaurantCategories, restaurants } from "@/server/db/schema";

export async function POST(request: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
	}

	let validated: ReturnType<typeof createRestaurantSchema.parse>;
	try {
		validated = createRestaurantSchema.parse(body);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: error.errors }, { status: 400 });
		}
		throw error;
	}

	const bodyObj = body as Record<string, unknown>;
	const placeLat = typeof bodyObj.latitude === "number" ? bodyObj.latitude : undefined;
	const placeLng = typeof bodyObj.longitude === "number" ? bodyObj.longitude : undefined;

	let latitude: number;
	let longitude: number;

	if (placeLat !== undefined && placeLng !== undefined) {
		latitude = placeLat;
		longitude = placeLng;
	} else {
		const geo = await geocodeAddress(validated.address);
		if (!geo) {
			return NextResponse.json({ error: "Adresse introuvable" }, { status: 422 });
		}
		latitude = geo.latitude;
		longitude = geo.longitude;
	}

	const { categoryIds, ...restaurantData } = validated;

	const [restaurant] = await db
		.insert(restaurants)
		.values({ ...restaurantData, latitude, longitude, createdBy: session.user.id })
		.returning({ id: restaurants.id });

	if (categoryIds.length > 0) {
		await db
			.insert(restaurantCategories)
			.values(categoryIds.map((categoryId) => ({ restaurantId: restaurant.id, categoryId })));
	}

	revalidatePath("/");
	return NextResponse.json({ data: { id: restaurant.id } }, { status: 201 });
}
