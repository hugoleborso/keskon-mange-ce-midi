import { beforeEach, describe, expect, it, vi } from "vitest";

const mockWhere = vi.fn();
const mockLimit = vi.fn();

vi.mock("../db", () => ({
	db: {
		select: vi.fn(() => ({
			from: vi.fn(() => ({
				innerJoin: vi.fn(() => ({
					where: mockWhere,
				})),
				where: vi.fn(() => ({
					limit: mockLimit,
				})),
			})),
		})),
	},
}));

vi.mock("../db/schema", () => ({
	lunchAttendance: {
		userId: "user_id",
		restaurantId: "restaurant_id",
		date: "date",
	},
	users: {
		id: "id",
		name: "name",
		image: "image",
	},
}));

const { getRestaurantAttendance, getAllAttendanceForDate, getUserAttendance, getTodayDateString } =
	await import("./attendance");

describe("getTodayDateString", () => {
	it("returns a YYYY-MM-DD formatted string", () => {
		const result = getTodayDateString();
		expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});
});

describe("getRestaurantAttendance", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns attendance users for a restaurant", async () => {
		const mockUsers = [
			{ userId: "u1", name: "Alice", image: "alice.jpg" },
			{ userId: "u2", name: "Bob", image: null },
		];
		mockWhere.mockResolvedValueOnce(mockUsers);

		const result = await getRestaurantAttendance("r1", "2026-03-23");
		expect(result).toEqual(mockUsers);
	});

	it("returns empty array when nobody is attending", async () => {
		mockWhere.mockResolvedValueOnce([]);

		const result = await getRestaurantAttendance("r1", "2026-03-23");
		expect(result).toEqual([]);
	});
});

describe("getAllAttendanceForDate", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns a map of restaurant attendance", async () => {
		const rows = [
			{ restaurantId: "r1", userId: "u1", name: "Alice", image: "a.jpg" },
			{ restaurantId: "r1", userId: "u2", name: "Bob", image: null },
			{ restaurantId: "r2", userId: "u3", name: "Charlie", image: "c.jpg" },
		];
		mockWhere.mockResolvedValueOnce(rows);

		const result = await getAllAttendanceForDate("2026-03-23");
		expect(result.get("r1")).toHaveLength(2);
		expect(result.get("r2")).toHaveLength(1);
	});

	it("returns empty map when no attendance", async () => {
		mockWhere.mockResolvedValueOnce([]);

		const result = await getAllAttendanceForDate("2026-03-23");
		expect(result.size).toBe(0);
	});
});

describe("getUserAttendance", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns restaurantId when attending", async () => {
		mockLimit.mockResolvedValueOnce([{ restaurantId: "r1" }]);

		const result = await getUserAttendance("u1", "2026-03-23");
		expect(result).toBe("r1");
	});

	it("returns null when not attending", async () => {
		mockLimit.mockResolvedValueOnce([]);

		const result = await getUserAttendance("u1", "2026-03-23");
		expect(result).toBeNull();
	});
});
