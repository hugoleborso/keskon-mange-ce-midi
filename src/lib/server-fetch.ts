import { cookies, headers } from "next/headers";

export async function serverFetch(path: string): Promise<Response> {
	const [headerStore, cookieStore] = await Promise.all([headers(), cookies()]);
	const host = headerStore.get("host") ?? "localhost:3000";
	const proto = headerStore.get("x-forwarded-proto") ?? "http";
	return fetch(`${proto}://${host}${path}`, {
		headers: { cookie: cookieStore.toString() },
		cache: "no-store",
	});
}
