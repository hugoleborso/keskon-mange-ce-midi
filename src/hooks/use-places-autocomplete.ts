"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface PlaceSuggestion {
	displayName: string;
	formattedAddress: string;
	latitude: number;
	longitude: number;
}

export function usePlacesAutocomplete() {
	const [query, setQuery] = useState("");
	const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const fetchSuggestions = useCallback(async (input: string) => {
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

	useEffect(() => {
		if (debounceRef.current) {
			clearTimeout(debounceRef.current);
		}

		debounceRef.current = setTimeout(() => {
			fetchSuggestions(query);
		}, 300);

		return () => {
			if (debounceRef.current) {
				clearTimeout(debounceRef.current);
			}
		};
	}, [query, fetchSuggestions]);

	const clear = useCallback(() => {
		setSuggestions([]);
		setQuery("");
	}, []);

	return { query, setQuery, suggestions, isLoading, clear };
}
