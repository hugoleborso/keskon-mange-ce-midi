import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { geocodeAddress } from "@/lib/geocoding";
import { updateRestaurantSchema } from "@/lib/validations/restaurant";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { restaurantCategories, restaurants } from "@/server/db/schema";
import { getRestaurantById } from "@/server/queries/restaurants";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
	}

	const { id } = await params;
	const data = await getRestaurantById(id);
	if (!data) {
		return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
	}

	return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
	}

	const { id } = await params;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
	}

	let validated: ReturnType<typeof updateRestaurantSchema.parse>;
	try {
		validated = updateRestaurantSchema.parse({ ...(body as object), id });
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

	await db
		.update(restaurants)
		.set({ ...restaurantData, latitude, longitude, updatedAt: new Date() })
		.where(eq(restaurants.id, validated.id));

	await db.delete(restaurantCategories).where(eq(restaurantCategories.restaurantId, validated.id));
	if (categoryIds.length > 0) {
		await db
			.insert(restaurantCategories)
			.values(categoryIds.map((categoryId) => ({ restaurantId: validated.id, categoryId })));
	}

	revalidatePath("/");
	revalidatePath(`/restaurants/${validated.id}`);
	return NextResponse.json({ data: { id: validated.id } });
}
