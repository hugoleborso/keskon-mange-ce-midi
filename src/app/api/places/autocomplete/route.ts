import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";

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

	const apiKey = process.env.GOOGLE_PLACES_API_KEY;
	if (!apiKey) {
		return NextResponse.json({ error: "Google Places API non configuree" }, { status: 503 });
	}

	const input = request.nextUrl.searchParams.get("input");
	if (!input || input.length < 2) {
		return NextResponse.json({ suggestions: [] });
	}

	try {
		const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Goog-Api-Key": apiKey,
				"X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location",
			},
			body: JSON.stringify({
				textQuery: input,
				locationBias: {
					circle: {
						center: { latitude: 48.8566, longitude: 2.3522 },
						radius: 20000,
					},
				},
				maxResultCount: 5,
				languageCode: "fr",
			}),
		});

		if (!response.ok) {
			return NextResponse.json({ suggestions: [] });
		}

		const data = await response.json();

		const suggestions: PlaceSuggestion[] = (data.places ?? []).map(
			(place: {
				displayName?: { text?: string };
				formattedAddress?: string;
				location?: { latitude?: number; longitude?: number };
			}) => ({
				displayName: place.displayName?.text ?? "",
				formattedAddress: place.formattedAddress ?? "",
				latitude: place.location?.latitude ?? 0,
				longitude: place.location?.longitude ?? 0,
			}),
		);

		return NextResponse.json({ suggestions });
	} catch {
		return NextResponse.json({ suggestions: [] });
	}
}
