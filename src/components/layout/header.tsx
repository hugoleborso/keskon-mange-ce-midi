import { eq } from "drizzle-orm";
import { Heart, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as m from "@/paraglide/messages.js";
import { auth, signOut } from "@/server/auth";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { SubmitButton } from "../ui/submit-button";

const backgroundColor = "red";

export async function Header() {
	const session = await auth();

	if (!session?.user) return null;

	let isAdmin = false;
	if (session.user.id) {
		const [user] = await db
			.select({ role: users.role })
			.from(users)
			.where(eq(users.id, session.user.id))
			.limit(1);
		isAdmin = user?.role === "admin";
	}

	return (
		<header
			className="flex items-center justify-between border-b px-4 py-3"
			style={{ backgroundColor }}
		>
			<Link href="/" className="text-lg font-bold">
				{m.app_title()}
			</Link>
			<div className="flex items-center gap-3">
				{isAdmin && (
					<Link
						href="/admin/categories"
						className="flex items-center gap-1 text-sm hover:text-primary"
					>
						<Settings className="h-4 w-4" />
						<span className="hidden sm:inline">{m.admin_categories()}</span>
					</Link>
				)}
				<Link href="/favorites" className="flex items-center gap-1 text-sm hover:text-red-500">
					<Heart className="h-4 w-4" />
					<span className="hidden sm:inline">{m.favorites_title()}</span>
				</Link>
				{session.user.image && (
					<Image
						src={session.user.image}
						alt={session.user.name ?? ""}
						width={32}
						height={32}
						className="rounded-full"
					/>
				)}
				<span className="text-sm">{session.user.name}</span>
				<form
					action={async () => {
						"use server";
						await signOut();
					}}
				>
					<SubmitButton className="text-sm text-muted-foreground hover:underline">
						{m.header_sign_out()}
					</SubmitButton>
				</form>
			</div>
		</header>
	);
}
