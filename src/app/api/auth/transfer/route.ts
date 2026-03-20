import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isProjectPreviewUrl } from "@/lib/vercel-preview";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const to = searchParams.get("to");

	if (!to || !isProjectPreviewUrl(to)) {
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
