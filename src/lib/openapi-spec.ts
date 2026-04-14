import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import "@/lib/openapi"; // call extendZodWithOpenApi
import { PRICE_RANGES } from "@/lib/constants";
import { toggleAttendanceSchema } from "@/lib/validations/attendance";
import { createCategorySchema, updateCategorySchema } from "@/lib/validations/category";
import { createRestaurantSchema, updateRestaurantSchema } from "@/lib/validations/restaurant";
import { createReviewSchema, updateReviewSchema } from "@/lib/validations/review";

const registry = new OpenAPIRegistry();

// --- Schemas ---

const ErrorSchema = registry.register(
	"Error",
	z.object({ error: z.string().or(z.array(z.unknown())) }).openapi("Error"),
);

const RestaurantIdSchema = registry.register(
	"RestaurantId",
	z.object({ data: z.object({ id: z.string().uuid() }) }).openapi("RestaurantId"),
);

registry.register("CreateRestaurant", createRestaurantSchema);
registry.register("UpdateRestaurant", updateRestaurantSchema);
registry.register("CreateReview", createReviewSchema);
registry.register("UpdateReview", updateReviewSchema);
registry.register("CreateCategory", createCategorySchema);
registry.register("UpdateCategory", updateCategorySchema);
registry.register("ToggleAttendance", toggleAttendanceSchema);

const ToggleFavoriteSchema = registry.register(
	"ToggleFavorite",
	z.object({ restaurantId: z.string().uuid() }).openapi("ToggleFavorite"),
);

const ToggleReviewLikeSchema = registry.register(
	"ToggleReviewLike",
	z.object({ reviewId: z.string().uuid() }).openapi("ToggleReviewLike"),
);

const RestaurantSchema = registry.register(
	"Restaurant",
	z
		.object({
			id: z.string().uuid(),
			name: z.string(),
			address: z.string(),
			latitude: z.number(),
			longitude: z.number(),
			priceRange: z.enum(PRICE_RANGES).nullable(),
			dineIn: z.boolean(),
			takeAway: z.boolean(),
			status: z.string(),
			averageRating: z.number().nullable(),
			reviewsCount: z.number(),
		})
		.openapi("Restaurant"),
);

const CategorySchema = registry.register(
	"Category",
	z
		.object({
			id: z.string().uuid(),
			name: z.string(),
			slug: z.string(),
		})
		.openapi("Category"),
);

const ReviewSchema = registry.register(
	"Review",
	z
		.object({
			id: z.string().uuid(),
			restaurantId: z.string().uuid(),
			rating: z.number(),
			comment: z.string().nullable(),
			author: z.object({ name: z.string().nullable(), image: z.string().nullable() }),
		})
		.openapi("Review"),
);

const AttendanceUserSchema = registry.register(
	"AttendanceUser",
	z
		.object({
			userId: z.string(),
			name: z.string().nullable(),
			image: z.string().nullable(),
		})
		.openapi("AttendanceUser"),
);

// --- Paths ---

// GET /api/restaurants
registry.registerPath({
	method: "get",
	path: "/api/restaurants",
	summary: "List restaurants",
	tags: ["Restaurants"],
	request: {
		query: z.object({
			dineIn: z.enum(["true", "false"]).optional(),
			takeAway: z.enum(["true", "false"]).optional(),
			priceRange: z.array(z.enum(PRICE_RANGES)).optional(),
			categoryId: z.string().uuid().optional(),
			status: z.string().optional(),
		}),
	},
	responses: {
		200: {
			description: "List of restaurants",
			content: { "application/json": { schema: z.object({ data: z.array(RestaurantSchema) }) } },
		},
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
	},
});

// GET /api/restaurants/{id}
registry.registerPath({
	method: "get",
	path: "/api/restaurants/{id}",
	summary: "Get a restaurant by ID",
	tags: ["Restaurants"],
	request: { params: z.object({ id: z.string().uuid() }) },
	responses: {
		200: {
			description: "Restaurant",
			content: { "application/json": { schema: z.object({ data: RestaurantSchema }) } },
		},
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
		404: { description: "Not found", content: { "application/json": { schema: ErrorSchema } } },
	},
});

// POST /api/restaurants
registry.registerPath({
	method: "post",
	path: "/api/restaurants",
	summary: "Create a restaurant",
	tags: ["Restaurants"],
	request: { body: { content: { "application/json": { schema: createRestaurantSchema } } } },
	responses: {
		201: {
			description: "Created",
			content: { "application/json": { schema: RestaurantIdSchema } },
		},
		400: {
			description: "Validation error",
			content: { "application/json": { schema: ErrorSchema } },
		},
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
	},
});

// PATCH /api/restaurants/{id}
registry.registerPath({
	method: "patch",
	path: "/api/restaurants/{id}",
	summary: "Update a restaurant",
	tags: ["Restaurants"],
	request: {
		params: z.object({ id: z.string().uuid() }),
		body: { content: { "application/json": { schema: updateRestaurantSchema } } },
	},
	responses: {
		200: {
			description: "Updated",
			content: { "application/json": { schema: RestaurantIdSchema } },
		},
		400: {
			description: "Validation error",
			content: { "application/json": { schema: ErrorSchema } },
		},
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
	},
});

// GET /api/reviews
registry.registerPath({
	method: "get",
	path: "/api/reviews",
	summary: "List reviews for a restaurant",
	tags: ["Reviews"],
	request: {
		query: z.object({ restaurantId: z.string().uuid() }),
	},
	responses: {
		200: {
			description: "List of reviews",
			content: { "application/json": { schema: z.object({ data: z.array(ReviewSchema) }) } },
		},
		400: {
			description: "Missing restaurantId",
			content: { "application/json": { schema: ErrorSchema } },
		},
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
	},
});

// POST /api/reviews
registry.registerPath({
	method: "post",
	path: "/api/reviews",
	summary: "Create a review",
	tags: ["Reviews"],
	request: { body: { content: { "application/json": { schema: createReviewSchema } } } },
	responses: {
		201: {
			description: "Created",
			content: { "application/json": { schema: z.object({ data: z.null() }) } },
		},
		400: {
			description: "Validation error",
			content: { "application/json": { schema: ErrorSchema } },
		},
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
	},
});

// PATCH /api/reviews
registry.registerPath({
	method: "patch",
	path: "/api/reviews",
	summary: "Update a review",
	tags: ["Reviews"],
	request: { body: { content: { "application/json": { schema: updateReviewSchema } } } },
	responses: {
		200: {
			description: "Updated",
			content: { "application/json": { schema: z.object({ data: z.null() }) } },
		},
		400: {
			description: "Validation error",
			content: { "application/json": { schema: ErrorSchema } },
		},
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
		403: { description: "Forbidden", content: { "application/json": { schema: ErrorSchema } } },
		404: { description: "Not found", content: { "application/json": { schema: ErrorSchema } } },
	},
});

// DELETE /api/reviews/{id}
registry.registerPath({
	method: "delete",
	path: "/api/reviews/{id}",
	summary: "Delete a review",
	tags: ["Reviews"],
	request: { params: z.object({ id: z.string().uuid() }) },
	responses: {
		200: {
			description: "Deleted",
			content: { "application/json": { schema: z.object({ data: z.null() }) } },
		},
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
		403: { description: "Forbidden", content: { "application/json": { schema: ErrorSchema } } },
		404: { description: "Not found", content: { "application/json": { schema: ErrorSchema } } },
	},
});

// GET /api/review-likes
registry.registerPath({
	method: "get",
	path: "/api/review-likes",
	summary: "Get like counts and current user likes for a restaurant's reviews",
	tags: ["Reviews"],
	request: {
		query: z.object({ restaurantId: z.string().uuid() }),
	},
	responses: {
		200: {
			description: "Like counts and user likes",
			content: {
				"application/json": {
					schema: z.object({
						data: z.object({
							counts: z.record(z.string(), z.number()),
							userLikes: z.array(z.string()),
						}),
					}),
				},
			},
		},
		400: {
			description: "Missing restaurantId",
			content: { "application/json": { schema: ErrorSchema } },
		},
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
	},
});

// POST /api/review-likes
registry.registerPath({
	method: "post",
	path: "/api/review-likes",
	summary: "Toggle a review like",
	tags: ["Reviews"],
	request: { body: { content: { "application/json": { schema: ToggleReviewLikeSchema } } } },
	responses: {
		200: {
			description: "Toggled",
			content: {
				"application/json": { schema: z.object({ data: z.object({ liked: z.boolean() }) }) },
			},
		},
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
	},
});

// GET /api/attendance/all
registry.registerPath({
	method: "get",
	path: "/api/attendance/all",
	summary: "Get attendance for all restaurants on a given date",
	tags: ["Attendance"],
	request: {
		query: z.object({
			date: z
				.string()
				.optional()
				.openapi({ description: "Date in YYYY-MM-DD format. Defaults to today." }),
		}),
	},
	responses: {
		200: {
			description: "Attendance map keyed by restaurant ID",
			content: {
				"application/json": {
					schema: z.object({ data: z.record(z.string(), z.array(AttendanceUserSchema)) }),
				},
			},
		},
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
	},
});

// GET /api/attendance/me
registry.registerPath({
	method: "get",
	path: "/api/attendance/me",
	summary: "Get which restaurant the current user is attending",
	tags: ["Attendance"],
	request: {
		query: z.object({
			date: z
				.string()
				.optional()
				.openapi({ description: "Date in YYYY-MM-DD format. Defaults to today." }),
		}),
	},
	responses: {
		200: {
			description: "Restaurant ID the user is attending, or null",
			content: {
				"application/json": {
					schema: z.object({ data: z.string().uuid().nullable() }),
				},
			},
		},
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
	},
});

// GET /api/attendance
registry.registerPath({
	method: "get",
	path: "/api/attendance",
	summary: "Get attendance for a restaurant on a given date",
	tags: ["Attendance"],
	request: {
		query: z.object({
			restaurantId: z.string().uuid(),
			date: z
				.string()
				.optional()
				.openapi({ description: "Date in YYYY-MM-DD format. Defaults to today." }),
		}),
	},
	responses: {
		200: {
			description: "Attendance list",
			content: {
				"application/json": { schema: z.object({ data: z.array(AttendanceUserSchema) }) },
			},
		},
		400: {
			description: "Missing restaurantId",
			content: { "application/json": { schema: ErrorSchema } },
		},
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
	},
});

// POST /api/attendance
registry.registerPath({
	method: "post",
	path: "/api/attendance",
	summary: "Toggle lunch attendance",
	tags: ["Attendance"],
	request: { body: { content: { "application/json": { schema: toggleAttendanceSchema } } } },
	responses: {
		200: {
			description: "Toggled",
			content: { "application/json": { schema: z.object({ data: z.null() }) } },
		},
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
	},
});

// GET /api/favorites/restaurants
registry.registerPath({
	method: "get",
	path: "/api/favorites/restaurants",
	summary: "Get current user's favorite restaurants with ratings",
	tags: ["Favorites"],
	responses: {
		200: {
			description: "List of favorite restaurants",
			content: {
				"application/json": { schema: z.object({ data: z.array(RestaurantSchema) }) },
			},
		},
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
	},
});

// GET /api/favorites
registry.registerPath({
	method: "get",
	path: "/api/favorites",
	summary: "Get current user's favorite restaurant IDs",
	tags: ["Favorites"],
	responses: {
		200: {
			description: "List of favorite restaurant IDs",
			content: {
				"application/json": { schema: z.object({ data: z.array(z.string().uuid()) }) },
			},
		},
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
	},
});

// POST /api/favorites
registry.registerPath({
	method: "post",
	path: "/api/favorites",
	summary: "Toggle a favorite restaurant",
	tags: ["Favorites"],
	request: { body: { content: { "application/json": { schema: ToggleFavoriteSchema } } } },
	responses: {
		200: {
			description: "Toggled",
			content: {
				"application/json": { schema: z.object({ data: z.object({ favorited: z.boolean() }) }) },
			},
		},
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
	},
});

// GET /api/reviews/me
registry.registerPath({
	method: "get",
	path: "/api/reviews/me",
	summary: "Get the current user's review for a restaurant",
	tags: ["Reviews"],
	request: {
		query: z.object({ restaurantId: z.string().uuid() }),
	},
	responses: {
		200: {
			description: "The user's review, or null",
			content: {
				"application/json": { schema: z.object({ data: ReviewSchema.nullable() }) },
			},
		},
		400: {
			description: "Missing restaurantId",
			content: { "application/json": { schema: ErrorSchema } },
		},
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
	},
});

// GET /api/restaurants/{id}/categories
registry.registerPath({
	method: "get",
	path: "/api/restaurants/{id}/categories",
	summary: "Get category IDs for a restaurant",
	tags: ["Restaurants"],
	request: { params: z.object({ id: z.string().uuid() }) },
	responses: {
		200: {
			description: "List of category IDs",
			content: {
				"application/json": {
					schema: z.object({ data: z.array(z.string().uuid()) }),
				},
			},
		},
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
	},
});

// GET /api/categories
registry.registerPath({
	method: "get",
	path: "/api/categories",
	summary: "List all categories",
	tags: ["Categories"],
	responses: {
		200: {
			description: "List of categories",
			content: { "application/json": { schema: z.object({ data: z.array(CategorySchema) }) } },
		},
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
	},
});

// GET /api/categories/{id}
registry.registerPath({
	method: "get",
	path: "/api/categories/{id}",
	summary: "Get a category by ID",
	tags: ["Categories"],
	request: { params: z.object({ id: z.string().uuid() }) },
	responses: {
		200: {
			description: "Category",
			content: { "application/json": { schema: z.object({ data: CategorySchema }) } },
		},
		401: { description: "Unauthorized", content: { "application/json": { schema: ErrorSchema } } },
		404: { description: "Not found", content: { "application/json": { schema: ErrorSchema } } },
	},
});

// POST /api/categories
registry.registerPath({
	method: "post",
	path: "/api/categories",
	summary: "Create a category (admin only)",
	tags: ["Categories"],
	request: { body: { content: { "application/json": { schema: createCategorySchema } } } },
	responses: {
		201: {
			description: "Created",
			content: { "application/json": { schema: z.object({ data: z.null() }) } },
		},
		400: {
			description: "Validation error",
			content: { "application/json": { schema: ErrorSchema } },
		},
		403: { description: "Forbidden", content: { "application/json": { schema: ErrorSchema } } },
	},
});

// PATCH /api/categories/{id}
registry.registerPath({
	method: "patch",
	path: "/api/categories/{id}",
	summary: "Update a category (admin only)",
	tags: ["Categories"],
	request: {
		params: z.object({ id: z.string().uuid() }),
		body: { content: { "application/json": { schema: updateCategorySchema } } },
	},
	responses: {
		200: {
			description: "Updated",
			content: { "application/json": { schema: z.object({ data: z.null() }) } },
		},
		400: {
			description: "Validation error",
			content: { "application/json": { schema: ErrorSchema } },
		},
		403: { description: "Forbidden", content: { "application/json": { schema: ErrorSchema } } },
	},
});

// DELETE /api/categories/{id}
registry.registerPath({
	method: "delete",
	path: "/api/categories/{id}",
	summary: "Delete a category (admin only)",
	tags: ["Categories"],
	request: { params: z.object({ id: z.string().uuid() }) },
	responses: {
		200: {
			description: "Deleted",
			content: { "application/json": { schema: z.object({ data: z.null() }) } },
		},
		403: { description: "Forbidden", content: { "application/json": { schema: ErrorSchema } } },
	},
});

export function generateOpenAPISpec() {
	const generator = new OpenApiGeneratorV3(registry.definitions);
	return generator.generateDocument({
		openapi: "3.0.0",
		info: {
			title: "Keskon Mange API",
			version: "1.0.0",
			description: "REST API for the collaborative restaurant picker app",
		},
		servers: [{ url: "/", description: "Current server" }],
	});
}
