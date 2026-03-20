import { describe, expect, it } from "vitest";
import { isProjectPreviewUrl } from "./vercel-preview";

describe("isProjectPreviewUrl", () => {
	it("accepts a valid preview URL", () => {
		expect(
			isProjectPreviewUrl("https://keskon-mange-ce-midi-abc123-hugoleborsos-projects.vercel.app"),
		).toBe(true);
	});

	it("accepts a valid preview URL with a path", () => {
		expect(
			isProjectPreviewUrl(
				"https://keskon-mange-ce-midi-xyz789-hugoleborsos-projects.vercel.app/restaurants",
			),
		).toBe(true);
	});

	it("rejects a different vercel.app domain", () => {
		expect(isProjectPreviewUrl("https://evil-app.vercel.app")).toBe(false);
	});

	it("rejects a URL with the right prefix but wrong scope", () => {
		expect(
			isProjectPreviewUrl("https://keskon-mange-ce-midi-abc123-attacker-projects.vercel.app"),
		).toBe(false);
	});

	it("rejects a URL with the right scope but wrong project", () => {
		expect(
			isProjectPreviewUrl("https://other-project-abc123-hugoleborsos-projects.vercel.app"),
		).toBe(false);
	});

	it("rejects http URLs", () => {
		expect(
			isProjectPreviewUrl("http://keskon-mange-ce-midi-abc123-hugoleborsos-projects.vercel.app"),
		).toBe(false);
	});

	it("rejects non-vercel.app domains", () => {
		expect(isProjectPreviewUrl("https://example.com")).toBe(false);
	});

	it("rejects invalid URLs", () => {
		expect(isProjectPreviewUrl("not-a-url")).toBe(false);
	});
});
