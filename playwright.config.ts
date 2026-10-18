import { defineConfig, devices } from "@playwright/test";

// Dedicated E2E port so the test server never collides with a dev server on
// :3000 and always boots fresh with E2E_TEST=1 (enables the test-login route).
const E2E_PORT = 3100;
const baseURL = `http://localhost:${E2E_PORT}`;

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",
	use: {
		baseURL,
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "mobile-chrome",
			use: { ...devices["Pixel 5"] },
		},
		{
			name: "desktop-chrome",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: {
		// E2E_TEST=1 enables the test-only login route (src/app/api/auth/test-login).
		command: `E2E_TEST=1 PORT=${E2E_PORT} pnpm dev`,
		url: baseURL,
		reuseExistingServer: !process.env.CI,
	},
});
