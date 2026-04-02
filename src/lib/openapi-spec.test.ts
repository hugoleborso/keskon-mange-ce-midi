import { describe, expect, it } from "vitest";
import { generateOpenAPISpec } from "./openapi-spec";

describe("generateOpenAPISpec", () => {
	it("generates a valid OpenAPI 3.0 document", () => {
		const spec = generateOpenAPISpec();
		expect(spec.openapi).toBe("3.0.0");
		expect(spec.info.title).toBe("Keskon Mange API");
		expect(spec.info.version).toBe("1.0.0");
	});

	it("includes all expected endpoints", () => {
		const spec = generateOpenAPISpec();
		const paths = Object.keys(spec.paths);
		expect(paths).toContain("/api/restaurants");
		expect(paths).toContain("/api/restaurants/{id}");
		expect(paths).toContain("/api/restaurants/{id}/categories");
		expect(paths).toContain("/api/reviews");
		expect(paths).toContain("/api/reviews/{id}");
		expect(paths).toContain("/api/reviews/me");
		expect(paths).toContain("/api/review-likes");
		expect(paths).toContain("/api/attendance");
		expect(paths).toContain("/api/attendance/all");
		expect(paths).toContain("/api/attendance/me");
		expect(paths).toContain("/api/favorites");
		expect(paths).toContain("/api/favorites/restaurants");
		expect(paths).toContain("/api/categories");
		expect(paths).toContain("/api/categories/{id}");
	});

	it("includes GET methods for query endpoints", () => {
		const spec = generateOpenAPISpec();
		expect(spec.paths["/api/restaurants"]).toHaveProperty("get");
		expect(spec.paths["/api/restaurants/{id}"]).toHaveProperty("get");
		expect(spec.paths["/api/restaurants/{id}/categories"]).toHaveProperty("get");
		expect(spec.paths["/api/reviews"]).toHaveProperty("get");
		expect(spec.paths["/api/reviews/me"]).toHaveProperty("get");
		expect(spec.paths["/api/categories"]).toHaveProperty("get");
		expect(spec.paths["/api/categories/{id}"]).toHaveProperty("get");
		expect(spec.paths["/api/attendance"]).toHaveProperty("get");
		expect(spec.paths["/api/attendance/all"]).toHaveProperty("get");
		expect(spec.paths["/api/attendance/me"]).toHaveProperty("get");
		expect(spec.paths["/api/favorites"]).toHaveProperty("get");
		expect(spec.paths["/api/favorites/restaurants"]).toHaveProperty("get");
		expect(spec.paths["/api/review-likes"]).toHaveProperty("get");
	});
});
