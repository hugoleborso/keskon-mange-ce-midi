import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createReviewSchema, updateReviewSchema } from "@/lib/validations/review";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { reviews } from "@/server/db/schema";

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

	let validated: ReturnType<typeof createReviewSchema.parse>;
	try {
		validated = createReviewSchema.parse(body);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: error.errors }, { status: 400 });
		}
		throw error;
	}

	await db.insert(reviews).values({
		...validated,
		photoUrls: validated.photoUrls.length > 0 ? validated.photoUrls : null,
		authorId: session.user.id,
	});

	revalidatePath(`/restaurants/${validated.restaurantId}`);
	revalidatePath("/");
	return NextResponse.json({ data: null }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
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

	let validated: ReturnType<typeof updateReviewSchema.parse>;
	try {
		validated = updateReviewSchema.parse(body);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: error.errors }, { status: 400 });
		}
		throw error;
	}

	const [existing] = await db
		.select({ authorId: reviews.authorId, restaurantId: reviews.restaurantId })
		.from(reviews)
		.where(eq(reviews.id, validated.id))
		.limit(1);

	if (!existing) {
		return NextResponse.json({ error: "Avis introuvable" }, { status: 404 });
	}
	if (existing.authorId !== session.user.id) {
		return NextResponse.json({ error: "Non autorise" }, { status: 403 });
	}

	await db
		.update(reviews)
		.set({
			rating: validated.rating,
			comment: validated.comment,
			photoUrls: validated.photoUrls.length > 0 ? validated.photoUrls : null,
			updatedAt: new Date(),
		})
		.where(eq(reviews.id, validated.id));

	revalidatePath(`/restaurants/${existing.restaurantId}`);
	revalidatePath("/");
	return NextResponse.json({ data: null });
}
