import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { db } from "./db";
import { accounts, sessions, users, verificationTokens } from "./db/schema";

export const { handlers, auth, signIn, signOut } = NextAuth({
	...authConfig,
	adapter: DrizzleAdapter(db, {
		usersTable: users,
		accountsTable: accounts,
		sessionsTable: sessions,
		verificationTokensTable: verificationTokens,
	}),
});
