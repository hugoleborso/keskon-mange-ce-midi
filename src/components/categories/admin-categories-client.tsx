"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import * as m from "@/paraglide/messages.js";

type Category = { id: string; name: string };

export function AdminCategoriesClient({ categories }: { categories: Category[] }) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const createFormRef = useRef<HTMLFormElement>(null);

	const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const fd = new FormData(e.currentTarget);
		const name = fd.get("name") as string;
		startTransition(async () => {
			await fetch("/api/categories", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name }),
			});
			createFormRef.current?.reset();
			router.refresh();
		});
	};

	const handleUpdate = (id: string) => (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const fd = new FormData(e.currentTarget);
		const name = fd.get("name") as string;
		startTransition(async () => {
			await fetch(`/api/categories/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name }),
			});
			router.refresh();
		});
	};

	const handleDelete = (id: string) => () => {
		startTransition(async () => {
			await fetch(`/api/categories/${id}`, { method: "DELETE" });
			router.refresh();
		});
	};

	return (
		<>
			<form ref={createFormRef} onSubmit={handleCreate} className="mb-6 flex gap-2">
				<input
					name="name"
					type="text"
					required
					placeholder={m.category_name_placeholder()}
					className="flex-1 rounded-md border px-3 py-2 text-sm"
				/>
				<button
					type="submit"
					disabled={isPending}
					className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
				>
					{m.category_add()}
				</button>
			</form>

			<div className="space-y-2">
				{categories.map((category) => (
					<div key={category.id} className="flex items-center gap-2 rounded-lg border p-3">
						<form onSubmit={handleUpdate(category.id)} className="flex flex-1 items-center gap-2">
							<input
								name="name"
								type="text"
								required
								defaultValue={category.name}
								className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm"
							/>
							<button
								type="submit"
								disabled={isPending}
								className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
							>
								{m.category_save()}
							</button>
						</form>
						<button
							type="button"
							disabled={isPending}
							onClick={handleDelete(category.id)}
							className="text-sm text-destructive hover:underline disabled:opacity-50"
						>
							{m.category_delete()}
						</button>
					</div>
				))}
				{categories.length === 0 && (
					<p className="text-sm text-muted-foreground">{m.category_empty()}</p>
				)}
			</div>
		</>
	);
}
