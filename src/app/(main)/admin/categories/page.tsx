import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AdminCategoriesClient } from "@/components/categories/admin-categories-client";
import { serverFetch } from "@/lib/server-fetch";
import * as m from "@/paraglide/messages.js";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";

export default async function AdminCategoriesPage() {
	const session = await auth();
	if (!session?.user?.id) redirect("/");

	const [user] = await db
		.select({ role: users.role })
		.from(users)
		.where(eq(users.id, session.user.id))
		.limit(1);

	if (!user || user.role !== "admin") redirect("/");

	const res = await serverFetch("/api/categories");
	const { data: categories } = (await res.json()) as {
		data: { id: string; name: string; slug: string }[];
	};

	return (
		<main className="mx-auto max-w-2xl p-4">
			<h1 className="mb-6 text-2xl font-bold">{m.admin_categories()}</h1>
			<AdminCategoriesClient categories={categories} />
		</main>
	);
}
