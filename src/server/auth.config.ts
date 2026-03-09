import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

function isVercelPreviewUrl(url: string): boolean {
	try {
		const parsed = new URL(url);
		return parsed.protocol === "https:" && parsed.hostname.endsWith(".vercel.app");
	} catch {
		return false;
	}
}

export const authConfig = {
	providers: [Google],
	pages: {
		signIn: "/login",
	},
	session: { strategy: "jwt" },
	callbacks: {
		authorized({ auth }) {
			return !!auth?.user;
		},
		jwt({ token, user }) {
			if (user) {
				token.id = user.id;
			}
			return token;
		},
		session({ session, token }) {
			if (token.id) {
				session.user.id = token.id as string;
			}
			return session;
		},
		redirect({ url, baseUrl }) {
			// Relative URLs: resolve against base
			if (url.startsWith("/")) return `${baseUrl}${url}`;

			// Same origin: allow
			if (url.startsWith(baseUrl)) return url;

			// Vercel preview: route through session transfer
			if (isVercelPreviewUrl(url)) {
				return `${baseUrl}/api/auth/transfer?to=${encodeURIComponent(url)}`;
			}

			return baseUrl;
		},
	},
} satisfies NextAuthConfig;
