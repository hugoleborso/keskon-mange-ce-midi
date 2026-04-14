import { describe, expect, it } from "vitest";
import "./openapi";
import { z } from "zod";

describe("openapi", () => {
	it("extends Zod with openapi method", () => {
		const schema = z.string();
		expect(typeof schema.openapi).toBe("function");
	});
});
