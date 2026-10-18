import { expect, test } from "@playwright/test";

// TEST END-TO-END : on joue le parcours complet dans un vrai navigateur, comme
// un vrai utilisateur. On se connecte, on ouvre ses favoris, et on vérifie de
// nos yeux que la pastille "beurk 🤮" est bien affichée sur le mauvais resto.
test("un restaurant mal noté affiche la pastille beurk dans les favoris", async ({ page }) => {
	// Connexion de test : seed les données (dont un resto noté 1 étoile) et pose la session.
	await page.goto("/api/auth/test-login");
	await expect(page).toHaveURL(/\/favorites/);

	// La carte du mauvais restaurant porte la pastille.
	const badCard = page.locator("div.rounded-lg.border", { hasText: "Le Cafard Grognon (E2E)" });
	await expect(badCard.getByText("beurk 🤮")).toBeVisible();

	// La carte du bon restaurant (sans avis) ne la porte pas.
	const goodCard = page.locator("div.rounded-lg.border", { hasText: "Chez Luigi (E2E)" });
	await expect(goodCard).not.toContainText("beurk 🤮");
});
