import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getUserReview } from "@/server/queries/reviews";

export async function GET(request: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const restaurantId = searchParams.get("restaurantId");
	if (!restaurantId) {
		return NextResponse.json({ error: "restaurantId requis" }, { status: 400 });
	}

	const review = await getUserReview(restaurantId, session.user.id);
	return NextResponse.json({ data: review });
}
