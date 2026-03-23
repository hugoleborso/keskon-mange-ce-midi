import { eq } from "drizzle-orm";
import { db } from "../db";
import { categories } from "../db/schema";

export async function getCategories() {
	return db.select().from(categories).orderBy(categories.name);
}

export async function getCategoryById(id: string) {
	const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
	return rows[0] ?? null;
}
