import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getRestaurantCategoryIds } from "@/server/queries/restaurants";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
	}

	const { id } = await params;
	const categoryIds = await getRestaurantCategoryIds(id);
	return NextResponse.json({ data: categoryIds });
}
