import Image from "next/image";
import * as m from "@/paraglide/messages.js";
import { auth, signOut } from "@/server/auth";

export async function Header() {
	const session = await auth();

	if (!session?.user) return null;

	return (
		<header className="flex items-center justify-between border-b px-4 py-3">
			<span className="text-lg font-bold">{m.app_title()}</span>
			<div className="flex items-center gap-3">
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
					<button type="submit" className="text-sm text-muted-foreground hover:underline">
						{m.header_sign_out()}
					</button>
				</form>
			</div>
		</header>
	);
}
