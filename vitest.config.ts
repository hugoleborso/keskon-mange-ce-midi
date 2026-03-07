import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	test: {
		environment: "jsdom",
		setupFiles: ["./src/test/setup.ts"],
		exclude: ["e2e/**", "node_modules/**"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["src/**/*.{ts,tsx}"],
			exclude: [
				"src/paraglide/**",
				"src/app/**/layout.tsx",
				"src/app/**/loading.tsx",
				"src/app/**/error.tsx",
				"src/components/ui/**",
				"src/test/**",
			],
			thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
		},
	},
});
