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
			include: [
				"src/lib/**/*.ts",
				"src/server/actions/**/*.ts",
				"src/server/queries/**/*.ts",
				"src/hooks/**/*.ts",
			],
			exclude: ["src/**/*.test.ts"],
			thresholds: { lines: 100, functions: 100, branches: 100, statements: 100 },
		},
	},
});
