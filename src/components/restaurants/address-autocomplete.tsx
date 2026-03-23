"use client";

import { useRef, useState } from "react";
import { type PlaceSuggestion, usePlacesAutocomplete } from "@/hooks/use-places-autocomplete";
import * as m from "@/paraglide/messages.js";

export function AddressAutocomplete({
	defaultValue,
	onSelect,
	onClear,
}: {
	defaultValue?: string;
	onSelect?: (suggestion: PlaceSuggestion) => void;
	onClear?: () => void;
}) {
	const { setQuery, suggestions, isLoading } = usePlacesAutocomplete();
	const [address, setAddress] = useState(defaultValue ?? "");
	const [showSuggestions, setShowSuggestions] = useState(false);
	const wrapperRef = useRef<HTMLDivElement>(null);

	const handleSelect = (suggestion: PlaceSuggestion) => {
		setAddress(suggestion.formattedAddress);
		setQuery("");
		setShowSuggestions(false);
		onSelect?.(suggestion);
	};

	return (
		<div ref={wrapperRef} className="relative">
			<input
				id="address"
				name="address"
				type="text"
				required
				value={address}
				onChange={(e) => {
					setAddress(e.target.value);
					setQuery(e.target.value);
					setShowSuggestions(true);
					onClear?.();
				}}
				onFocus={() => {
					if (suggestions.length > 0) setShowSuggestions(true);
				}}
				onBlur={() => {
					// Delay to allow click on suggestion
					setTimeout(() => setShowSuggestions(false), 200);
				}}
				placeholder={m.restaurant_address()}
				className="w-full rounded-md border px-3 py-2"
			/>
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
			{isLoading && showSuggestions && (
				<div className="absolute right-3 top-2.5 text-xs text-muted-foreground">...</div>
			)}
		</div>
	);
}
