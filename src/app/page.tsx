import * as m from "@/paraglide/messages.js";

export default function HomePage() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-8">
			<h1 className="text-4xl font-bold">{m.app_title()}</h1>
			<p className="mt-4 text-lg text-gray-600">{m.home_coming_soon()}</p>
		</main>
	);
}
