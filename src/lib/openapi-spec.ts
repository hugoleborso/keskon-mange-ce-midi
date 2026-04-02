import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import "@/lib/openapi"; // call extendZodWithOpenApi
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

// --- Paths ---

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
