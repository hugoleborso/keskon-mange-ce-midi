import { z } from "zod";
import { LABELS, PRICE_RANGES, RESTAURANT_STATUSES, RESTAURANT_TYPES } from "../constants";

export const createRestaurantSchema = z.object({
	name: z.string().min(1, "Le nom est requis").max(100),
	address: z.string().min(1, "L'adresse est requise").max(300),
	restaurantType: z.enum(RESTAURANT_TYPES).optional(),
	categoryId: z.string().uuid().optional(),
	labels: z.array(z.enum(LABELS)).default([]),
	priceRange: z.enum(PRICE_RANGES),
	dineIn: z.boolean().default(true),
	takeAway: z.boolean().default(false),
});

export const updateRestaurantSchema = createRestaurantSchema.extend({
	id: z.string().uuid(),
	status: z.enum(RESTAURANT_STATUSES).optional(),
});
