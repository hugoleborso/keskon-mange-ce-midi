import { isProjectPreviewUrl } from "@/lib/vercel-preview";
import { signIn } from "@/server/auth";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const returnTo = searchParams.get("returnTo");

	if (!returnTo || !isProjectPreviewUrl(returnTo)) {
		return new Response("Invalid returnTo URL", { status: 400 });
	}

	await signIn("google", { redirectTo: returnTo });
}
