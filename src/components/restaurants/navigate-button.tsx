import * as m from "@/paraglide/messages.js";

export function NavigateButton({ latitude, longitude }: { latitude: number; longitude: number }) {
	return (
		<a
			href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
			target="_blank"
			rel="noopener noreferrer"
			className="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:bg-foreground/80"
		>
			{m.restaurant_navigate()}
		</a>
	);
}
