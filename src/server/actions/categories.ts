"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
	createCategorySchema,
	deleteCategorySchema,
	slugify,
	updateCategorySchema,
} from "@/lib/validations/category";
import { auth } from "../auth";
import { db } from "../db";
import { categories, restaurants, users } from "../db/schema";

async function requireAdmin() {
	const session = await auth();
	if (!session?.user?.id) throw new Error("Non authentifie");

	const [user] = await db
		.select({ role: users.role })
		.from(users)
		.where(eq(users.id, session.user.id))
		.limit(1);

	if (!user || user.role !== "admin") throw new Error("Non autorise");

	return session.user.id;
}

export async function createCategory(formData: FormData) {
	await requireAdmin();

	const validated = createCategorySchema.parse({
		name: formData.get("name"),
	});

	const slug = slugify(validated.name);

	await db.insert(categories).values({
		name: validated.name,
		slug,
	});

	revalidatePath("/admin/categories");
	revalidatePath("/");
}

export async function updateCategory(formData: FormData) {
	await requireAdmin();

	const validated = updateCategorySchema.parse({
		id: formData.get("id"),
		name: formData.get("name"),
	});

	const slug = slugify(validated.name);

	await db
		.update(categories)
		.set({
			name: validated.name,
			slug,
			updatedAt: new Date(),
		})
		.where(eq(categories.id, validated.id));

	revalidatePath("/admin/categories");
	revalidatePath("/");
}

export async function deleteCategory(formData: FormData) {
	await requireAdmin();

	const validated = deleteCategorySchema.parse({
		id: formData.get("id"),
	});

	// Set categoryId to null for restaurants using this category
	await db
		.update(restaurants)
		.set({ categoryId: null })
		.where(eq(restaurants.categoryId, validated.id));

	await db.delete(categories).where(eq(categories.id, validated.id));

	revalidatePath("/admin/categories");
	revalidatePath("/");
}
