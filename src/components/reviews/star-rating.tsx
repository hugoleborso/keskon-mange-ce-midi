"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import * as m from "@/paraglide/messages.js";

export function StarRating({
	value,
	name = "rating",
	onChange,
	readOnly = false,
}: {
	value: number;
	name?: string;
	onChange?: (rating: number) => void;
	readOnly?: boolean;
}) {
	const [hovered, setHovered] = useState(0);

	return (
		<fieldset className="flex items-center gap-0.5 border-none p-0">
			<legend className="sr-only">{m.review_rating()}</legend>
			<input type="hidden" name={name} value={value} />
			{[1, 2, 3, 4, 5].map((star) => {
				const filled = readOnly ? star <= value : star <= (hovered || value);
				return (
					<label
						key={star}
						className={`cursor-pointer p-0.5 ${readOnly ? "pointer-events-none" : ""}`}
						onMouseEnter={() => !readOnly && setHovered(star)}
						onMouseLeave={() => !readOnly && setHovered(0)}
					>
						<input
							type="radio"
							name={`${name}_radio`}
							value={star}
							checked={star === value}
							onChange={() => onChange?.(star)}
							disabled={readOnly}
							className="sr-only"
							aria-label={`${star}/5`}
						/>
						<Star
							className={`h-5 w-5 ${filled ? "fill-yellow-400 text-yellow-400" : "fill-none text-muted-foreground"}`}
						/>
					</label>
				);
			})}
		</fieldset>
	);
}
