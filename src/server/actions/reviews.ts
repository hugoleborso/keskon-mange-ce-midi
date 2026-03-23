"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createReviewSchema, updateReviewSchema } from "@/lib/validations/review";
import { auth } from "../auth";
import { db } from "../db";
import { reviews } from "../db/schema";

export async function createReview(formData: FormData) {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Non authentifie");

	const raw = {
		restaurantId: formData.get("restaurantId"),
		rating: formData.get("rating"),
		comment: formData.get("comment") || undefined,
		photoUrls: formData.getAll("photoUrls").filter((v) => typeof v === "string" && v.length > 0),
	};

	const validated = createReviewSchema.parse(raw);

	await db.insert(reviews).values({
		...validated,
		photoUrls: validated.photoUrls.length > 0 ? validated.photoUrls : null,
		authorId: session.user.id,
	});

	revalidatePath(`/restaurants/${validated.restaurantId}`);
	revalidatePath("/");
}

export async function updateReview(formData: FormData) {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Non authentifie");

	const raw = {
		id: formData.get("id"),
		rating: formData.get("rating"),
		comment: formData.get("comment") || undefined,
		photoUrls: formData.getAll("photoUrls").filter((v) => typeof v === "string" && v.length > 0),
	};

	const validated = updateReviewSchema.parse(raw);

	const [existing] = await db
		.select({ authorId: reviews.authorId, restaurantId: reviews.restaurantId })
		.from(reviews)
		.where(eq(reviews.id, validated.id))
		.limit(1);

	if (!existing) throw new Error("Avis introuvable");
	if (existing.authorId !== session.user.id) throw new Error("Non autorise");

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
}

export async function deleteReview(formData: FormData) {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Non authentifie");

	const id = formData.get("id");
	if (typeof id !== "string") throw new Error("ID requis");

	const [existing] = await db
		.select({ authorId: reviews.authorId, restaurantId: reviews.restaurantId })
		.from(reviews)
		.where(eq(reviews.id, id))
		.limit(1);

	if (!existing) throw new Error("Avis introuvable");
	if (existing.authorId !== session.user.id) throw new Error("Non autorise");

	await db.delete(reviews).where(eq(reviews.id, id));

	revalidatePath(`/restaurants/${existing.restaurantId}`);
	revalidatePath("/");
}
