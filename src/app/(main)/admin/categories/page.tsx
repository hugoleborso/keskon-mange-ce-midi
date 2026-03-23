import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SubmitButton } from "@/components/ui/submit-button";
import * as m from "@/paraglide/messages.js";
import { createCategory, deleteCategory, updateCategory } from "@/server/actions/categories";
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

			{/* Add category form */}
			<form action={createCategory} className="mb-6 flex gap-2">
				<input
					name="name"
					type="text"
					required
					placeholder={m.category_name_placeholder()}
					className="flex-1 rounded-md border px-3 py-2 text-sm"
				/>
				<SubmitButton className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
					{m.category_add()}
				</SubmitButton>
			</form>

			{/* Category list */}
			<div className="space-y-2">
				{categories.map((category) => (
					<div key={category.id} className="flex items-center gap-2 rounded-lg border p-3">
						<form action={updateCategory} className="flex flex-1 items-center gap-2">
							<input type="hidden" name="id" value={category.id} />
							<input
								name="name"
								type="text"
								required
								defaultValue={category.name}
								className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm"
							/>
							<SubmitButton className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
								{m.category_save()}
							</SubmitButton>
						</form>
						<form action={deleteCategory}>
							<input type="hidden" name="id" value={category.id} />
							<SubmitButton className="text-sm text-destructive hover:underline">
								{m.category_delete()}
							</SubmitButton>
						</form>
					</div>
				))}
				{categories.length === 0 && (
					<p className="text-sm text-muted-foreground">{m.category_empty()}</p>
				)}
			</div>
		</main>
	);
}
