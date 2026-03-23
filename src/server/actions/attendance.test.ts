import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("../auth", () => ({
	auth: vi.fn(),
}));

vi.mock("../queries/attendance", () => ({
	getTodayDateString: vi.fn(() => "2026-03-23"),
}));

const mockInsertValues = vi.fn();
const mockUpdateWhere = vi.fn();
const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere }));
const mockDeleteWhere = vi.fn();
const mockSelectLimit = vi.fn();
const mockSelectWhere = vi.fn(() => ({ limit: mockSelectLimit }));
const mockSelectFrom = vi.fn(() => ({ where: mockSelectWhere }));

vi.mock("../db", () => ({
	db: {
		insert: vi.fn(() => ({ values: mockInsertValues })),
		update: vi.fn(() => ({ set: mockUpdateSet })),
		delete: vi.fn(() => ({ where: mockDeleteWhere })),
		select: vi.fn(() => ({ from: mockSelectFrom })),
	},
}));

vi.mock("../db/schema", () => ({
	lunchAttendance: {
		userId: "user_id",
		restaurantId: "restaurant_id",
		date: "date",
	},
}));

type MockFn = ReturnType<typeof vi.fn>;

const { toggleAttendance } = await import("./attendance");
const { auth } = (await import("../auth")) as unknown as { auth: MockFn };
const { revalidatePath } = (await import("next/cache")) as unknown as {
	revalidatePath: MockFn;
};

const validRestaurantId = "550e8400-e29b-41d4-a716-446655440000";
const otherRestaurantId = "660e8400-e29b-41d4-a716-446655440000";

function makeFormData(data: Record<string, string>): FormData {
	const fd = new FormData();
	for (const [key, value] of Object.entries(data)) {
		fd.set(key, value);
	}
	return fd;
}

describe("toggleAttendance", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("throws when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);

		await expect(
			toggleAttendance(makeFormData({ restaurantId: validRestaurantId })),
		).rejects.toThrow("Non authentifie");
	});

	it("creates new attendance when none exists", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([]);
		mockInsertValues.mockResolvedValueOnce(undefined);

		await toggleAttendance(makeFormData({ restaurantId: validRestaurantId }));

		expect(mockInsertValues).toHaveBeenCalledWith({
			userId: "user-1",
			restaurantId: validRestaurantId,
			date: "2026-03-23",
		});
		expect(revalidatePath).toHaveBeenCalledWith("/");
	});

	it("removes attendance when toggling same restaurant", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([{ restaurantId: validRestaurantId }]);
		mockDeleteWhere.mockResolvedValueOnce(undefined);

		await toggleAttendance(makeFormData({ restaurantId: validRestaurantId }));

		expect(mockDeleteWhere).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith("/");
	});

	it("switches restaurant when attending a different one", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([{ restaurantId: otherRestaurantId }]);
		mockUpdateWhere.mockResolvedValueOnce(undefined);

		await toggleAttendance(makeFormData({ restaurantId: validRestaurantId }));

		expect(mockUpdateSet).toHaveBeenCalledWith({ restaurantId: validRestaurantId });
		expect(revalidatePath).toHaveBeenCalledWith("/");
	});
});
