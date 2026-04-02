"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import * as m from "@/paraglide/messages.js";
import type { ReviewWithAuthor } from "@/server/queries/reviews";
import { ReviewForm } from "./review-form";
import { ReviewLikeButton } from "./review-like-button";
import { StarRating } from "./star-rating";

export function ReviewItem({
	review,
	isOwner,
	isLiked,
	likeCount,
}: {
	review: ReviewWithAuthor;
	isOwner: boolean;
	isLiked: boolean;
	likeCount: number;
}) {
	const [isEditing, setIsEditing] = useState(false);
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const handleDelete = () => {
		startTransition(async () => {
			await fetch(`/api/reviews/${review.id}`, { method: "DELETE" });
			router.refresh();
		});
	};

	if (isEditing) {
		return (
			<div className="rounded-lg border p-4">
				<ReviewForm
					restaurantId={review.restaurantId}
					existingReview={review}
					onDone={() => setIsEditing(false)}
				/>
			</div>
		);
	}

	return (
		<div className="rounded-lg border p-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					{review.author.image && (
						<Image
							src={review.author.image}
							alt={review.author.name ?? ""}
							width={24}
							height={24}
							className="rounded-full"
						/>
					)}
					<span className="text-sm font-medium">{review.author.name}</span>
				</div>
				{isOwner && (
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => setIsEditing(true)}
							className="text-xs text-muted-foreground hover:underline"
						>
							{m.review_edit()}
						</button>
						<button
							type="button"
							disabled={isPending}
							onClick={handleDelete}
							className="text-xs text-destructive hover:underline disabled:opacity-50"
						>
							{m.review_delete()}
						</button>
					</div>
				)}
			</div>
			<div className="mt-2">
				<StarRating value={review.rating} readOnly />
			</div>
			{review.comment && <p className="mt-2 text-sm">{review.comment}</p>}
			{review.photoUrls && review.photoUrls.length > 0 && (
				<div className="mt-3 flex flex-wrap gap-2">
					{review.photoUrls.map((url) => (
						<Image
							key={url}
							src={url}
							alt=""
							width={120}
							height={120}
							className="rounded-md object-cover"
							style={{ width: 120, height: 120 }}
						/>
					))}
				</div>
			)}
			<div className="mt-2">
				<ReviewLikeButton reviewId={review.id} isLiked={isLiked} likeCount={likeCount} />
			</div>
		</div>
	);
}
