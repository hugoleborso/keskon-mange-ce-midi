"use client";

import { useState } from "react";
import * as m from "@/paraglide/messages.js";
import { createReview, updateReview } from "@/server/actions/reviews";
import { StarRating } from "./star-rating";

export function ReviewForm({
	restaurantId,
	existingReview,
}: {
	restaurantId: string;
	existingReview?: { id: string; rating: number; comment: string | null } | null;
}) {
	const isEditing = !!existingReview;
	const [rating, setRating] = useState(existingReview?.rating ?? 0);

	const action = isEditing ? updateReview : createReview;

	return (
		<form action={action} className="space-y-3 rounded-lg border p-4">
			<h3 className="font-semibold">{isEditing ? m.review_edit() : m.review_add()}</h3>
			{isEditing ? (
				<input type="hidden" name="id" value={existingReview.id} />
			) : (
				<input type="hidden" name="restaurantId" value={restaurantId} />
			)}
			<div>
				<StarRating value={rating} onChange={setRating} />
			</div>
			<div>
				<textarea
					name="comment"
					placeholder={m.review_comment_placeholder()}
					defaultValue={existingReview?.comment ?? ""}
					maxLength={1000}
					rows={3}
					className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm"
				/>
			</div>
			<button
				type="submit"
				disabled={rating === 0}
				className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
			>
				{m.restaurant_save()}
			</button>
		</form>
	);
}
