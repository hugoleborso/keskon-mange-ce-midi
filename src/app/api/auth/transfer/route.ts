import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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
	const to = searchParams.get("to");

	if (!to || !isValidVercelPreviewUrl(to)) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	const cookieStore = await cookies();
	const sessionToken =
		cookieStore.get("__Secure-authjs.session-token")?.value ??
		cookieStore.get("authjs.session-token")?.value;

	if (!sessionToken) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	const targetUrl = new URL("/api/auth/receive", to);
	targetUrl.searchParams.set("token", sessionToken);

	return NextResponse.redirect(targetUrl.toString());
}
