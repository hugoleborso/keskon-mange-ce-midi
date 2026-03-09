import { NextResponse } from "next/server";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const token = searchParams.get("token");

	if (!token) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	const response = NextResponse.redirect(new URL("/", request.url));

	const isSecure = request.url.startsWith("https");
	const cookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";

	response.cookies.set(cookieName, token, {
		httpOnly: true,
		secure: isSecure,
		sameSite: "lax",
		path: "/",
		maxAge: 30 * 24 * 60 * 60,
	});

	return response;
}
