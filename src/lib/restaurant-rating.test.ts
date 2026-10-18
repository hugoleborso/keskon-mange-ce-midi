import { describe, expect, it } from "vitest";
import { isBeurk } from "./restaurant-rating";

// TEST UNITAIRE : on teste UNE petite brique isolée (la règle "beurk"),
// sans base de données ni interface. C'est rapide et on couvre tous les cas limites.
describe("isBeurk", () => {
	it("est beurk quand la moyenne est en dessous de 2", () => {
		expect(isBeurk(1.5, 3)).toBe(true);
	});

	it("n'est pas beurk quand la moyenne est bonne", () => {
		expect(isBeurk(4.2, 10)).toBe(false);
	});

	it("n'est PAS beurk à exactement 2 étoiles (cas limite du choix produit)", () => {
		expect(isBeurk(2, 5)).toBe(false);
	});

	it("n'est pas beurk quand le restaurant n'a encore aucun avis", () => {
		expect(isBeurk(null, 0)).toBe(false);
	});
});
