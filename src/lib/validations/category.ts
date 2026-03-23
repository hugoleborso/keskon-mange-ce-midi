import { z } from "zod";

export const createCategorySchema = z.object({
	name: z.string().min(1, "Le nom est requis").max(50),
});

export const updateCategorySchema = z.object({
	id: z.string().uuid(),
	name: z.string().min(1, "Le nom est requis").max(50),
});

export const deleteCategorySchema = z.object({
	id: z.string().uuid(),
});

export function slugify(name: string): string {
	return name
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}
