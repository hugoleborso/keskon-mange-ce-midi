"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PlaceSuggestion } from "@/hooks/use-places-autocomplete";
import { LABELS, PRICE_RANGE_DESCRIPTIONS, PRICE_RANGES, RESTAURANT_TYPES } from "@/lib/constants";
import * as m from "@/paraglide/messages.js";
import type { RestaurantWithRating } from "@/server/queries/restaurants";
import { SubmitButton } from "../ui/submit-button";
import { AddressAutocomplete } from "./address-autocomplete";

type Category = { id: string; name: string };

export function RestaurantFormClient({
	restaurant,
	categories,
	selectedCategoryIds = [],
}: {
	restaurant?: RestaurantWithRating;
	categories?: Category[];
	selectedCategoryIds?: string[];
}) {
	const hasCategories = categories && categories.length > 0;
	const isEditing = !!restaurant;
	const [placeData, setPlaceData] = useState<{
		name: string;
		latitude: number;
		longitude: number;
	} | null>(null);
	const [nameValue, setNameValue] = useState(restaurant?.name ?? "");
	const [submitting, setSubmitting] = useState(false);
	const isGeocoded = isEditing || placeData !== null;
	const router = useRouter();

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

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const fd = new FormData(e.currentTarget);

		const body = {
			name: fd.get("name") as string,
			address: fd.get("address") as string,
			restaurantType: (fd.get("restaurantType") as string) || undefined,
			categoryIds: fd.getAll("categoryIds") as string[],
			labels: fd.getAll("labels") as string[],
			priceRange: fd.get("priceRange") as string,
			dineIn: fd.get("dineIn") === "on",
			takeAway: fd.get("takeAway") === "on",
			latitude: placeData?.latitude,
			longitude: placeData?.longitude,
			...(isEditing && { status: (fd.get("status") as string) || undefined }),
		};

		setSubmitting(true);
		try {
			const endpoint = isEditing ? `/api/restaurants/${restaurant.id}` : "/api/restaurants";
			const method = isEditing ? "PATCH" : "POST";

			const res = await fetch(endpoint, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (!res.ok) return;

			const { data } = await res.json();
			const restaurantId = restaurant?.id ?? data.id;
			router.push(`/restaurants/${restaurantId}`);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="grid gap-4">
			{restaurant && <input type="hidden" name="id" value={restaurant.id} />}

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
				<fieldset className="grid gap-1.5">
					<legend className="text-sm font-medium">{m.restaurant_type()}</legend>
					<div className="flex flex-wrap gap-2">
						{categories.map((cat) => (
							<label key={cat.id} className="flex items-center gap-1.5 text-sm">
								<input
									type="checkbox"
									name="categoryIds"
									value={cat.id}
									defaultChecked={selectedCategoryIds.includes(cat.id)}
								/>
								{cat.name}
							</label>
						))}
					</div>
				</fieldset>
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
				disabled={!isGeocoded || submitting}
				className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
			>
				{m.restaurant_save()}
			</SubmitButton>
		</form>
	);
}
