"use client";

import { useCallback, useState } from "react";

export interface PlaceSuggestion {
	displayName: string;
	formattedAddress: string;
	latitude: number;
	longitude: number;
}

export function usePlacesAutocomplete() {
	const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const search = useCallback(async (input: string) => {
		if (input.length < 2) {
			setSuggestions([]);
			return;
		}

		setIsLoading(true);
		try {
			const response = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(input)}`);
			if (response.ok) {
				const data = await response.json();
				setSuggestions(data.suggestions ?? []);
			}
		} catch {
			setSuggestions([]);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const clear = useCallback(() => {
		setSuggestions([]);
	}, []);

	return { suggestions, isLoading, search, clear };
}
