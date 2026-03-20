/**
 * Validates that a URL is a Vercel preview deployment for THIS project.
 *
 * Vercel preview URLs follow the pattern:
 *   https://<project>-<hash>-<scope>.vercel.app
 *
 * We check against the project name and team scope to prevent
 * session token theft via attacker-controlled .vercel.app domains.
 */
export function isProjectPreviewUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		if (parsed.protocol !== "https:") return false;

		const hostname = parsed.hostname;
		if (!hostname.endsWith(".vercel.app")) return false;

		// VERCEL_PROJECT_PRODUCTION_URL = "keskon-mange-ce-midi-three.vercel.app" (or similar)
		// Preview URLs look like: keskon-mange-ce-midi-<hash>-hugoleborsos-projects.vercel.app
		// We match on the project name prefix and team scope suffix.
		const projectPrefix = "keskon-mange-ce-midi-";
		const teamSuffix = "-hugoleborsos-projects.vercel.app";

		return hostname.startsWith(projectPrefix) && hostname.endsWith(teamSuffix);
	} catch {
		return false;
	}
}
