import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { db } from "@/server/db";
import { favorites, restaurants, reviews, users } from "@/server/db/schema";

// Fixed IDs so repeated test runs stay idempotent (no duplicated rows).
const TEST_USER_ID = "e2e-user";
const TEST_USER_EMAIL = "e2e@test.local";
const TEST_RESTAURANT_ID = "e2e-restaurant";
// A deliberately badly-rated restaurant to exercise the "beurk 🤮" badge.
const TEST_BAD_RESTAURANT_ID = "e2e-restaurant-bad";
const TEST_BAD_REVIEW_ID = "e2e-review-bad";

// Auth.js stores the JWT session in this cookie over http (localhost).
// Over https it would be prefixed with `__Secure-`.
const SESSION_COOKIE = "authjs.session-token";

/**
 * Test-only login used by the Playwright E2E suite.
 *
 * A real Google OAuth flow cannot run in an automated browser, so in test
 * mode (E2E_TEST=1, never set in production) this route:
 *   1. seeds a known user + a favorite restaurant (idempotent),
 *   2. mints a valid Auth.js session cookie,
 *   3. redirects to /favorites already authenticated.
 *
 * The E2E_TEST guard keeps this door firmly shut in production.
 */
export async function GET(request: Request) {
	if (process.env.E2E_TEST !== "1") {
		return new NextResponse("Not found", { status: 404 });
	}

	// 1. Seed a deterministic world (safe to call on every run).
	await db
		.insert(users)
		.values({ id: TEST_USER_ID, email: TEST_USER_EMAIL, name: "E2E Tester" })
		.onConflictDoNothing();

	await db
		.insert(restaurants)
		.values({
			id: TEST_RESTAURANT_ID,
			name: "Chez Luigi (E2E)",
			address: "1 rue du Test, 75000 Paris",
			latitude: 48.8566,
			longitude: 2.3522,
			status: "active",
			createdBy: TEST_USER_ID,
		})
		.onConflictDoNothing();

	await db
		.insert(favorites)
		.values({ userId: TEST_USER_ID, restaurantId: TEST_RESTAURANT_ID })
		.onConflictDoNothing();

	// A second favorite that is badly rated (1 star) so the "beurk 🤮" badge shows.
	await db
		.insert(restaurants)
		.values({
			id: TEST_BAD_RESTAURANT_ID,
			name: "Le Cafard Grognon (E2E)",
			address: "2 rue du Test, 75000 Paris",
			latitude: 48.8566,
			longitude: 2.3522,
			status: "active",
			createdBy: TEST_USER_ID,
		})
		.onConflictDoNothing();

	await db
		.insert(reviews)
		.values({
			id: TEST_BAD_REVIEW_ID,
			restaurantId: TEST_BAD_RESTAURANT_ID,
			authorId: TEST_USER_ID,
			rating: 1,
			comment: "Immangeable.",
		})
		.onConflictDoNothing();

	await db
		.insert(favorites)
		.values({ userId: TEST_USER_ID, restaurantId: TEST_BAD_RESTAURANT_ID })
		.onConflictDoNothing();

	// 2. Mint the session cookie exactly as Auth.js would after a real login.
	const token = await encode({
		token: { id: TEST_USER_ID, sub: TEST_USER_ID, name: "E2E Tester", email: TEST_USER_EMAIL },
		secret: process.env.AUTH_SECRET as string,
		salt: SESSION_COOKIE,
	});

	// 3. Redirect to /favorites, already authenticated.
	const response = NextResponse.redirect(new URL("/favorites", request.url));
	response.cookies.set(SESSION_COOKIE, token, {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
	});
	return response;
}
