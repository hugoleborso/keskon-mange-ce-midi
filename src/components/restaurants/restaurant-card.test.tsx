import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { RestaurantWithRating } from "@/server/queries/restaurants";
import { RestaurantCard } from "./restaurant-card";

afterEach(cleanup);

// TEST D'INTÉGRATION : on assemble plusieurs briques (la règle "beurk" + le
// composant qui affiche la carte) et on vérifie que, mises ensemble, elles
// affichent bien la pastille au bon moment.

function makeRestaurant(overrides: Partial<RestaurantWithRating>): RestaurantWithRating {
	return {
		id: "resto-1",
		name: "Le Rade du Coin",
		address: "3 rue du Test, 75000 Paris",
		latitude: 0,
		longitude: 0,
		restaurantType: null,
		labels: null,
		priceRange: null,
		dineIn: true,
		takeAway: false,
		status: "active",
		photoCoverUrl: null,
		createdBy: "user-1",
		createdAt: new Date(),
		updatedAt: new Date(),
		averageRating: null,
		reviewsCount: 0,
		...overrides,
	};
}

describe("RestaurantCard - pastille beurk", () => {
	it("affiche la pastille beurk quand la moyenne est mauvaise", () => {
		render(<RestaurantCard restaurant={makeRestaurant({ averageRating: 1.4, reviewsCount: 5 })} />);
		expect(screen.getByText("beurk 🤮")).toBeInTheDocument();
	});

	it("n'affiche pas la pastille beurk quand la moyenne est bonne", () => {
		render(<RestaurantCard restaurant={makeRestaurant({ averageRating: 4.5, reviewsCount: 8 })} />);
		expect(screen.queryByText("beurk 🤮")).not.toBeInTheDocument();
	});
});
