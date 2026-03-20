import { z } from "zod";

export const createReviewSchema = z.object({
	restaurantId: z.string().uuid(),
	rating: z.coerce.number().int().min(1).max(5),
	comment: z.string().max(1000).optional(),
});

export const updateReviewSchema = z.object({
	id: z.string().uuid(),
	rating: z.coerce.number().int().min(1).max(5),
	comment: z.string().max(1000).optional(),
});
