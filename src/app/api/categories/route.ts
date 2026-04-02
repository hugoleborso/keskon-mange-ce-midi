import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createCategorySchema, slugify } from "@/lib/validations/category";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { categories, users } from "@/server/db/schema";

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

export async function POST(request: NextRequest) {
	const userId = await requireAdmin();
	if (!userId) {
		return NextResponse.json({ error: "Non autorise" }, { status: 403 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
	}

	let validated: ReturnType<typeof createCategorySchema.parse>;
	try {
		validated = createCategorySchema.parse(body);
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: error.errors }, { status: 400 });
		}
		throw error;
	}

	const slug = slugify(validated.name);
	await db.insert(categories).values({ name: validated.name, slug });

	revalidatePath("/admin/categories");
	revalidatePath("/");
	return NextResponse.json({ data: null }, { status: 201 });
}
