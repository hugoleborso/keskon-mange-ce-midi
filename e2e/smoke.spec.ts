import { expect, test } from "@playwright/test";

test("app loads without errors", async ({ page }) => {
	await page.goto("/");
	await expect(page.locator("h1")).toContainText("Keskon mange");
});
