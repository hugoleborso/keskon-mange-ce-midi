"use client";

import { useState } from "react";
import { type PlaceSuggestion, usePlacesAutocomplete } from "@/hooks/use-places-autocomplete";
import * as m from "@/paraglide/messages.js";

export function AddressAutocomplete({
	defaultValue,
	defaultName,
	onSelect,
	onClear,
}: {
	defaultValue?: string;
	defaultName?: string;
	onSelect?: (suggestion: PlaceSuggestion) => void;
	onClear?: () => void;
}) {
	const { suggestions, isLoading, search, clear } = usePlacesAutocomplete();
	const [address, setAddress] = useState(defaultValue ?? "");
	const [showSuggestions, setShowSuggestions] = useState(false);

	const handleSearch = () => {
		const query = address || defaultName || "";
		if (query.length >= 2) {
			search(query);
			setShowSuggestions(true);
		}
	};

	const handleSelect = (suggestion: PlaceSuggestion) => {
		setAddress(suggestion.formattedAddress);
		clear();
		setShowSuggestions(false);
		onSelect?.(suggestion);
	};

	return (
		<div className="relative">
			<div className="flex gap-2">
				<input
					id="address"
					name="address"
					type="text"
					required
					value={address}
					onChange={(e) => {
						setAddress(e.target.value);
						setShowSuggestions(false);
						onClear?.();
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							handleSearch();
						}
					}}
					placeholder={m.restaurant_address()}
					className="flex-1 rounded-md border px-3 py-2"
				/>
				<button
					type="button"
					onClick={handleSearch}
					disabled={isLoading}
					className="rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:bg-foreground/80 disabled:opacity-50"
				>
					{isLoading ? "..." : m.restaurant_search_address()}
				</button>
			</div>
			{showSuggestions && suggestions.length > 0 && (
				<ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-md">
					{suggestions.map((suggestion) => (
						<li key={`${suggestion.latitude}-${suggestion.longitude}`}>
							<button
								type="button"
								onClick={() => handleSelect(suggestion)}
								className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
							>
								<span className="font-medium">{suggestion.displayName}</span>
								<span className="block text-xs text-muted-foreground">
									{suggestion.formattedAddress}
								</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
