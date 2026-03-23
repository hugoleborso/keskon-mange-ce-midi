import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";

interface NominatimResult {
	display_name: string;
	name: string;
	lat: string;
	lon: string;
}

interface PlaceSuggestion {
	displayName: string;
	formattedAddress: string;
	latitude: number;
	longitude: number;
}

export async function GET(request: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
	}

	const input = request.nextUrl.searchParams.get("input");
	if (!input || input.length < 2) {
		return NextResponse.json({ suggestions: [] });
	}

	try {
		const url = new URL("https://nominatim.openstreetmap.org/search");
		url.searchParams.set("q", input);
		url.searchParams.set("format", "json");
		url.searchParams.set("limit", "5");
		url.searchParams.set("addressdetails", "1");
		url.searchParams.set("viewbox", "2.0,49.1,2.7,48.5");
		url.searchParams.set("bounded", "1");
		url.searchParams.set("accept-language", "fr");

		const response = await fetch(url.toString(), {
			headers: { "User-Agent": "keskon-mange-ce-midi/1.0" },
		});

		if (!response.ok) {
			return NextResponse.json({ suggestions: [] });
		}

		const results: NominatimResult[] = await response.json();

		const suggestions: PlaceSuggestion[] = results.map((result) => ({
			displayName: result.name || result.display_name.split(",")[0],
			formattedAddress: result.display_name,
			latitude: Number.parseFloat(result.lat),
			longitude: Number.parseFloat(result.lon),
		}));

		return NextResponse.json({ suggestions });
	} catch {
		return NextResponse.json({ suggestions: [] });
	}
}
