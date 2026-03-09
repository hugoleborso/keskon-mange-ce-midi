import Link from "next/link";
import * as m from "@/paraglide/messages.js";

export default function RestaurantNotFound() {
	return (
		<main className="mx-auto max-w-2xl p-4 text-center">
			<h1 className="text-2xl font-bold">{m.restaurant_not_found()}</h1>
			<Link href="/" className="mt-4 inline-block text-primary hover:underline">
				{m.not_found_go_home()}
			</Link>
		</main>
	);
}
