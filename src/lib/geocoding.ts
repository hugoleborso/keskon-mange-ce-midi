interface NominatimResult {
	lat: string;
	lon: string;
	display_name: string;
}

export interface GeocodingResult {
	latitude: number;
	longitude: number;
	displayName: string;
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
	const url = new URL("https://nominatim.openstreetmap.org/search");
	url.searchParams.set("q", address);
	url.searchParams.set("format", "json");
	url.searchParams.set("limit", "1");

	const response = await fetch(url.toString(), {
		headers: { "User-Agent": "keskon-mange-ce-midi/1.0" },
	});

	if (!response.ok) return null;

	const results: NominatimResult[] = await response.json();

	if (results.length === 0) return null;

	const result = results[0];
	return {
		latitude: Number.parseFloat(result.lat),
		longitude: Number.parseFloat(result.lon),
		displayName: result.display_name,
	};
}
