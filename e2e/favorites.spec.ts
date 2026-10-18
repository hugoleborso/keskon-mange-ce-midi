import { expect, test } from "@playwright/test";

test("un utilisateur connecté voit ses restaurants favoris", async ({ page }) => {
	// Connexion de test : la route seed les données (user + resto + favori),
	// pose un cookie de session valide, puis redirige vers /favorites.
	await page.goto("/api/auth/test-login");

	await expect(page).toHaveURL(/\/favorites/);
	await expect(page.getByRole("heading", { name: "Mes favoris" })).toBeVisible();
	await expect(page.getByText("Chez Luigi (E2E)")).toBeVisible();
});
