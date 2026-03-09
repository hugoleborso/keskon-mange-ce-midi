"use client";

import * as m from "@/paraglide/messages.js";

export default function MainError({ reset }: { reset: () => void }) {
	return (
		<main className="flex flex-col items-center justify-center gap-4 p-8 text-center">
			<h1 className="text-2xl font-bold">{m.error_title()}</h1>
			<p className="text-muted-foreground">{m.error_description()}</p>
			<button
				type="button"
				onClick={reset}
				className="rounded-lg bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90"
			>
				{m.error_retry()}
			</button>
		</main>
	);
}
