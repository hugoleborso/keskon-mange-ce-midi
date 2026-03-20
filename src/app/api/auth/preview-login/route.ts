import { signIn } from "@/server/auth";

function isValidVercelPreviewUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return parsed.protocol === "https:" && parsed.hostname.endsWith(".vercel.app");
	} catch {
		return false;
	}
}

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const returnTo = searchParams.get("returnTo");

	if (!returnTo || !isValidVercelPreviewUrl(returnTo)) {
		return new Response("Invalid returnTo URL", { status: 400 });
	}

	await signIn("google", { redirectTo: returnTo });
}
