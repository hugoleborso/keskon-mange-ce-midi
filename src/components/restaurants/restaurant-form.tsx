import { LABELS, PRICE_RANGE_LABELS, PRICE_RANGES, RESTAURANT_TYPES } from "@/lib/constants";
import * as m from "@/paraglide/messages.js";
import type { RestaurantWithRating } from "@/server/queries/restaurants";

export function RestaurantForm({
	action,
	restaurant,
}: {
	action: (formData: FormData) => Promise<void>;
	restaurant?: RestaurantWithRating;
}) {
	return (
		<form action={action} className="grid gap-4">
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
					defaultValue={restaurant?.name}
					className="rounded-md border px-3 py-2"
				/>
			</div>

			<div className="grid gap-1.5">
				<label htmlFor="address" className="text-sm font-medium">
					{m.restaurant_address()}
				</label>
				<input
					id="address"
					name="address"
					type="text"
					required
					defaultValue={restaurant?.address}
					className="rounded-md border px-3 py-2"
				/>
			</div>

			<div className="grid gap-1.5">
				<label htmlFor="restaurantType" className="text-sm font-medium">
					{m.restaurant_type()}
				</label>
				<select
					id="restaurantType"
					name="restaurantType"
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

			<div className="grid gap-1.5">
				<label htmlFor="priceRange" className="text-sm font-medium">
					{m.restaurant_price_range()}
				</label>
				<select
					id="priceRange"
					name="priceRange"
					defaultValue={restaurant?.priceRange ?? ""}
					className="rounded-md border px-3 py-2"
				>
					<option value="" />
					{PRICE_RANGES.map((range) => (
						<option key={range} value={range}>
							{PRICE_RANGE_LABELS[range]}
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

			<button
				type="submit"
				className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
			>
				{m.restaurant_save()}
			</button>
		</form>
	);
}
