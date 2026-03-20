"use client";

import * as m from "@/paraglide/messages.js";

export default function RestaurantError({ reset }: { reset: () => void }) {
	return (
		<main className="mx-auto max-w-2xl p-4 text-center">
			<h1 className="text-2xl font-bold">{m.error_title()}</h1>
			<p className="mt-2 text-muted-foreground">{m.error_description()}</p>
			<button
				type="button"
				onClick={reset}
				className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90"
			>
				{m.error_retry()}
			</button>
		</main>
	);
}
