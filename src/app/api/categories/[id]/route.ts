import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { slugify, updateCategorySchema } from "@/lib/validations/category";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { categories, restaurantCategories, users } from "@/server/db/schema";
import { getCategoryById } from "@/server/queries/categories";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
	}

	const { id } = await params;
	const data = await getCategoryById(id);
	if (!data) {
		return NextResponse.json({ error: "Categorie introuvable" }, { status: 404 });
	}

	return NextResponse.json({ data });
}

async function requireAdmin() {
	const session = await auth();
	if (!session?.user?.id) return null;

	const [user] = await db
		.select({ role: users.role })
		.from(users)
		.where(eq(users.id, session.user.id))
		.limit(1);

	if (!user || user.role !== "admin") return null;
	return session.user.id;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const userId = await requireAdmin();
	if (!userId) {
		return NextResponse.json({ error: "Non autorise" }, { status: 403 });
	}

	const { id } = await params;

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
	}

	let validated: ReturnType<typeof updateCategorySchema.parse>;
	try {
		validated = updateCategorySchema.parse({ ...(body as object), id });
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: error.errors }, { status: 400 });
		}
		throw error;
	}

	const slug = slugify(validated.name);
	await db
		.update(categories)
		.set({ name: validated.name, slug, updatedAt: new Date() })
		.where(eq(categories.id, validated.id));

	revalidatePath("/admin/categories");
	revalidatePath("/");
	return NextResponse.json({ data: null });
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const userId = await requireAdmin();
	if (!userId) {
		return NextResponse.json({ error: "Non autorise" }, { status: 403 });
	}

	const { id } = await params;

	await db.delete(restaurantCategories).where(eq(restaurantCategories.categoryId, id));
	await db.delete(categories).where(eq(categories.id, id));

	revalidatePath("/admin/categories");
	revalidatePath("/");
	return NextResponse.json({ data: null });
}
