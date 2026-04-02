import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getUserFavoriteRestaurants } from "@/server/queries/favorites";

export async function GET(_request: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
	}

	const restaurants = await getUserFavoriteRestaurants(session.user.id);
	return NextResponse.json({ data: restaurants });
}
