"use client";

import { useState } from "react";
import type { PlaceSuggestion } from "@/hooks/use-places-autocomplete";
import { LABELS, PRICE_RANGE_DESCRIPTIONS, PRICE_RANGES, RESTAURANT_TYPES } from "@/lib/constants";
import * as m from "@/paraglide/messages.js";
import type { RestaurantWithRating } from "@/server/queries/restaurants";
import { SubmitButton } from "../ui/submit-button";
import { AddressAutocomplete } from "./address-autocomplete";

type Category = { id: string; name: string };

export function RestaurantFormClient({
	action,
	restaurant,
	categories,
}: {
	action: (formData: FormData) => Promise<void>;
	restaurant?: RestaurantWithRating;
	categories?: Category[];
}) {
	const hasCategories = categories && categories.length > 0;
	const isEditing = !!restaurant;
	const [placeData, setPlaceData] = useState<{
		name: string;
		latitude: number;
		longitude: number;
	} | null>(null);
	const [nameValue, setNameValue] = useState(restaurant?.name ?? "");
	const isGeocoded = isEditing || placeData !== null;

	const handlePlaceSelect = (suggestion: PlaceSuggestion) => {
		setPlaceData({
			name: suggestion.displayName,
			latitude: suggestion.latitude,
			longitude: suggestion.longitude,
		});
		if (!nameValue) {
			setNameValue(suggestion.displayName);
		}
	};

	return (
		<form action={action} className="grid gap-4">
			{restaurant && <input type="hidden" name="id" value={restaurant.id} />}
			{placeData && (
				<>
					<input type="hidden" name="latitude" value={placeData.latitude} />
					<input type="hidden" name="longitude" value={placeData.longitude} />
				</>
			)}

			<div className="grid gap-1.5">
				<label htmlFor="name" className="text-sm font-medium">
					{m.restaurant_name()}
				</label>
				<input
					id="name"
					name="name"
					type="text"
					required
					value={nameValue}
					onChange={(e) => setNameValue(e.target.value)}
					className="rounded-md border px-3 py-2"
				/>
			</div>

			<div className="grid gap-1.5">
				<label htmlFor="address" className="text-sm font-medium">
					{m.restaurant_address()}
				</label>
				<AddressAutocomplete
					defaultValue={restaurant?.address}
					defaultName={nameValue}
					onSelect={handlePlaceSelect}
					onClear={() => setPlaceData(null)}
				/>
			</div>

			{hasCategories ? (
				<div className="grid gap-1.5">
					<label htmlFor="categoryId" className="text-sm font-medium">
						{m.restaurant_type()}
					</label>
					<select
						id="categoryId"
						name="categoryId"
						required
						defaultValue={restaurant?.categoryId ?? ""}
						className="rounded-md border px-3 py-2"
					>
						<option value="" />
						{categories.map((cat) => (
							<option key={cat.id} value={cat.id}>
								{cat.name}
							</option>
						))}
					</select>
				</div>
			) : (
				<div className="grid gap-1.5">
					<label htmlFor="restaurantType" className="text-sm font-medium">
						{m.restaurant_type()}
					</label>
					<select
						id="restaurantType"
						name="restaurantType"
						required
						defaultValue={restaurant?.restaurantType ?? ""}
						className="rounded-md border px-3 py-2"
					>
						<option value="" />
						{RESTAURANT_TYPES.map((type) => (
							<option key={type} value={type}>
								{type}
							</option>
						))}
					</select>
				</div>
			)}

			<div className="grid gap-1.5">
				<label htmlFor="priceRange" className="text-sm font-medium">
					{m.restaurant_price_range()}
				</label>
				<select
					id="priceRange"
					name="priceRange"
					required
					defaultValue={restaurant?.priceRange ?? ""}
					className="rounded-md border px-3 py-2"
				>
					<option value="" />
					{PRICE_RANGES.map((range) => (
						<option key={range} value={range}>
							{PRICE_RANGE_DESCRIPTIONS[range]}
						</option>
					))}
				</select>
			</div>

			<fieldset className="grid gap-1.5">
				<legend className="text-sm font-medium">{m.restaurant_labels()}</legend>
				<div className="flex flex-wrap gap-2">
					{LABELS.map((label) => (
						<label key={label} className="flex items-center gap-1.5 text-sm">
							<input
								type="checkbox"
								name="labels"
								value={label}
								defaultChecked={restaurant?.labels?.includes(label)}
							/>
							{label}
						</label>
					))}
				</div>
			</fieldset>

			<div className="flex gap-4">
				<label className="flex items-center gap-1.5 text-sm">
					<input type="checkbox" name="dineIn" defaultChecked={restaurant?.dineIn ?? true} />
					{m.restaurant_dine_in()}
				</label>
				<label className="flex items-center gap-1.5 text-sm">
					<input type="checkbox" name="takeAway" defaultChecked={restaurant?.takeAway ?? false} />
					{m.restaurant_take_away()}
				</label>
			</div>

			{!isGeocoded && (
				<p className="text-sm text-muted-foreground">{m.restaurant_select_address()}</p>
			)}
			<SubmitButton
				disabled={!isGeocoded}
				className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
			>
				{m.restaurant_save()}
			</SubmitButton>
		</form>
	);
}
