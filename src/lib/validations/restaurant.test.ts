import { describe, expect, it } from "vitest";
import { createRestaurantSchema, updateRestaurantSchema } from "./restaurant";

describe("createRestaurantSchema", () => {
	it("validates a minimal valid input", () => {
		const result = createRestaurantSchema.safeParse({
			name: "Chez Luigi",
			address: "12 rue de la Paix, Paris",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe("Chez Luigi");
			expect(result.data.labels).toEqual([]);
			expect(result.data.dineIn).toBe(true);
			expect(result.data.takeAway).toBe(false);
		}
	});

	it("validates a full valid input", () => {
		const result = createRestaurantSchema.safeParse({
			name: "Sushi Palace",
			address: "5 avenue des Champs",
			restaurantType: "japonais",
			labels: ["halal", "rapide"],
			priceRange: "EUR_2",
			dineIn: true,
			takeAway: true,
		});
		expect(result.success).toBe(true);
	});

	it("rejects empty name", () => {
		const result = createRestaurantSchema.safeParse({
			name: "",
			address: "12 rue de la Paix",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe("Le nom est requis");
		}
	});

	it("rejects name over 100 characters", () => {
		const result = createRestaurantSchema.safeParse({
			name: "a".repeat(101),
			address: "12 rue de la Paix",
		});
		expect(result.success).toBe(false);
	});

	it("rejects empty address", () => {
		const result = createRestaurantSchema.safeParse({
			name: "Chez Luigi",
			address: "",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe("L'adresse est requise");
		}
	});

	it("rejects address over 300 characters", () => {
		const result = createRestaurantSchema.safeParse({
			name: "Chez Luigi",
			address: "a".repeat(301),
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid restaurant type", () => {
		const result = createRestaurantSchema.safeParse({
			name: "Chez Luigi",
			address: "12 rue",
			restaurantType: "klingon",
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid label", () => {
		const result = createRestaurantSchema.safeParse({
			name: "Chez Luigi",
			address: "12 rue",
			labels: ["not-a-label"],
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid price range", () => {
		const result = createRestaurantSchema.safeParse({
			name: "Chez Luigi",
			address: "12 rue",
			priceRange: "EUR_99",
		});
		expect(result.success).toBe(false);
	});

	it("accepts optional fields as undefined", () => {
		const result = createRestaurantSchema.safeParse({
			name: "Chez Luigi",
			address: "12 rue",
			restaurantType: undefined,
			priceRange: undefined,
		});
		expect(result.success).toBe(true);
	});
});

describe("updateRestaurantSchema", () => {
	const validBase = {
		id: "550e8400-e29b-41d4-a716-446655440000",
		name: "Chez Luigi",
		address: "12 rue de la Paix",
	};

	it("validates with a valid UUID id", () => {
		const result = updateRestaurantSchema.safeParse(validBase);
		expect(result.success).toBe(true);
	});

	it("rejects missing id", () => {
		const result = updateRestaurantSchema.safeParse({
			name: "Chez Luigi",
			address: "12 rue",
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid UUID", () => {
		const result = updateRestaurantSchema.safeParse({
			...validBase,
			id: "not-a-uuid",
		});
		expect(result.success).toBe(false);
	});

	it("accepts valid status", () => {
		const result = updateRestaurantSchema.safeParse({
			...validBase,
			status: "temporarily_closed",
		});
		expect(result.success).toBe(true);
	});

	it("rejects invalid status", () => {
		const result = updateRestaurantSchema.safeParse({
			...validBase,
			status: "demolished",
		});
		expect(result.success).toBe(false);
	});
});
