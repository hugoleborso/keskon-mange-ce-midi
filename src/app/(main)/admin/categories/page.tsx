import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AdminCategoriesClient } from "@/components/categories/admin-categories-client";
import * as m from "@/paraglide/messages.js";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { getCategories } from "@/server/queries/categories";

export default async function AdminCategoriesPage() {
	const session = await auth();
	if (!session?.user?.id) redirect("/");

	const [user] = await db
		.select({ role: users.role })
		.from(users)
		.where(eq(users.id, session.user.id))
		.limit(1);

	if (!user || user.role !== "admin") redirect("/");

	const categories = await getCategories();

	return (
		<main className="mx-auto max-w-2xl p-4">
			<h1 className="mb-6 text-2xl font-bold">{m.admin_categories()}</h1>
			<AdminCategoriesClient categories={categories} />
		</main>
	);
}
