import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { reviewLikes, reviews } from "@/server/db/schema";

const toggleReviewLikeSchema = z.object({
	reviewId: z.string().uuid(),
});

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

	let validated: ReturnType<typeof toggleReviewLikeSchema.parse>;
	try {
		validated = toggleReviewLikeSchema.parse(body);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: error.errors }, { status: 400 });
		}
		throw error;
	}

	const userId = session.user.id;

	const [existing] = await db
		.select({ userId: reviewLikes.userId })
		.from(reviewLikes)
		.where(and(eq(reviewLikes.userId, userId), eq(reviewLikes.reviewId, validated.reviewId)))
		.limit(1);

	if (existing) {
		await db
			.delete(reviewLikes)
			.where(and(eq(reviewLikes.userId, userId), eq(reviewLikes.reviewId, validated.reviewId)));
	} else {
		await db.insert(reviewLikes).values({ userId, reviewId: validated.reviewId });
	}

	const [review] = await db
		.select({ restaurantId: reviews.restaurantId })
		.from(reviews)
		.where(eq(reviews.id, validated.reviewId))
		.limit(1);

	if (review) {
		revalidatePath(`/restaurants/${review.restaurantId}`);
	}

	return NextResponse.json({ data: { liked: !existing } });
}
