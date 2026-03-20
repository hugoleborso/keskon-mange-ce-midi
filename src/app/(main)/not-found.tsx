import Link from "next/link";
import * as m from "@/paraglide/messages.js";

export default function MainNotFound() {
	return (
		<main className="flex flex-col items-center justify-center gap-4 p-8 text-center">
			<h1 className="text-2xl font-bold">{m.not_found_title()}</h1>
			<p className="text-muted-foreground">{m.not_found_description()}</p>
			<Link
				href="/"
				className="rounded-lg bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90"
			>
				{m.not_found_go_home()}
			</Link>
		</main>
	);
}
