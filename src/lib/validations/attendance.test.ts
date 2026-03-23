import { describe, expect, it } from "vitest";
import { toggleAttendanceSchema } from "./attendance";

describe("toggleAttendanceSchema", () => {
	it("validates a valid UUID", () => {
		const result = toggleAttendanceSchema.safeParse({
			restaurantId: "550e8400-e29b-41d4-a716-446655440000",
		});
		expect(result.success).toBe(true);
	});

	it("rejects invalid UUID", () => {
		const result = toggleAttendanceSchema.safeParse({ restaurantId: "bad" });
		expect(result.success).toBe(false);
	});

	it("rejects missing restaurantId", () => {
		const result = toggleAttendanceSchema.safeParse({});
		expect(result.success).toBe(false);
	});
});
