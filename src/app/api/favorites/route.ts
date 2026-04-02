import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { favorites } from "@/server/db/schema";

const toggleFavoriteSchema = z.object({
	restaurantId: z.string().uuid(),
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

	let validated: ReturnType<typeof toggleFavoriteSchema.parse>;
	try {
		validated = toggleFavoriteSchema.parse(body);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: error.errors }, { status: 400 });
		}
		throw error;
	}

	const userId = session.user.id;

	const [existing] = await db
		.select({ userId: favorites.userId })
		.from(favorites)
		.where(and(eq(favorites.userId, userId), eq(favorites.restaurantId, validated.restaurantId)))
		.limit(1);

	if (existing) {
		await db
			.delete(favorites)
			.where(and(eq(favorites.userId, userId), eq(favorites.restaurantId, validated.restaurantId)));
	} else {
		await db.insert(favorites).values({ userId, restaurantId: validated.restaurantId });
	}

	revalidatePath("/");
	revalidatePath("/favorites");
	return NextResponse.json({ data: { favorited: !existing } });
}
