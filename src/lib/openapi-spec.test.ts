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
		expect(paths).toContain("/api/reviews");
		expect(paths).toContain("/api/reviews/{id}");
		expect(paths).toContain("/api/review-likes");
		expect(paths).toContain("/api/attendance");
		expect(paths).toContain("/api/favorites");
		expect(paths).toContain("/api/categories");
		expect(paths).toContain("/api/categories/{id}");
	});
});
