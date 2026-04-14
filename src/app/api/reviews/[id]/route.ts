import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { reviews } from "@/server/db/schema";

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
	}

	const { id } = await params;

	const [existing] = await db
		.select({ authorId: reviews.authorId, restaurantId: reviews.restaurantId })
		.from(reviews)
		.where(eq(reviews.id, id))
		.limit(1);

	if (!existing) {
		return NextResponse.json({ error: "Avis introuvable" }, { status: 404 });
	}
	if (existing.authorId !== session.user.id) {
		return NextResponse.json({ error: "Non autorise" }, { status: 403 });
	}

	await db.delete(reviews).where(eq(reviews.id, id));

	revalidatePath(`/restaurants/${existing.restaurantId}`);
	revalidatePath("/");
	return NextResponse.json({ data: null });
}
