import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

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
	},
} satisfies NextAuthConfig;
