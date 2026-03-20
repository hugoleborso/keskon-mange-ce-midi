import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
	revalidatePath: vi.fn(),
}));

vi.mock("../auth", () => ({
	auth: vi.fn(),
}));

const mockInsertValues = vi.fn();
const mockDeleteWhere = vi.fn();
const mockSelectLimit = vi.fn();
const mockSelectWhere = vi.fn(() => ({ limit: mockSelectLimit }));

vi.mock("../db", () => ({
	db: {
		select: vi.fn(() => ({
			from: vi.fn(() => ({
				where: mockSelectWhere,
			})),
		})),
		insert: vi.fn(() => ({ values: mockInsertValues })),
		delete: vi.fn(() => ({ where: mockDeleteWhere })),
	},
}));

vi.mock("../db/schema", () => ({
	favorites: {
		userId: "user_id",
		restaurantId: "restaurant_id",
	},
}));

type MockFn = ReturnType<typeof vi.fn>;

const { toggleFavorite } = await import("./favorites");
const { auth } = (await import("../auth")) as unknown as { auth: MockFn };
const { revalidatePath } = (await import("next/cache")) as unknown as {
	revalidatePath: MockFn;
};

describe("toggleFavorite", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("throws when not authenticated", async () => {
		auth.mockResolvedValueOnce(null);

		await expect(toggleFavorite("rest-1")).rejects.toThrow("Non authentifie");
	});

	it("adds favorite when not already favorited", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([]);
		mockInsertValues.mockResolvedValueOnce(undefined);

		await toggleFavorite("rest-1");

		expect(mockInsertValues).toHaveBeenCalledWith({
			userId: "user-1",
			restaurantId: "rest-1",
		});
		expect(revalidatePath).toHaveBeenCalledWith("/");
		expect(revalidatePath).toHaveBeenCalledWith("/favorites");
	});

	it("removes favorite when already favorited", async () => {
		auth.mockResolvedValueOnce({ user: { id: "user-1" } });
		mockSelectLimit.mockResolvedValueOnce([{ userId: "user-1", restaurantId: "rest-1" }]);
		mockDeleteWhere.mockResolvedValueOnce(undefined);

		await toggleFavorite("rest-1");

		expect(mockDeleteWhere).toHaveBeenCalled();
		expect(revalidatePath).toHaveBeenCalledWith("/");
		expect(revalidatePath).toHaveBeenCalledWith("/favorites");
	});
});
