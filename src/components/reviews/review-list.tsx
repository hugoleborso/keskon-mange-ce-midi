import * as m from "@/paraglide/messages.js";
import type { ReviewWithAuthor } from "@/server/queries/reviews";
import { ReviewItem } from "./review-item";

export function ReviewList({
	reviews,
	currentUserId,
	likeCounts,
	userLikes,
}: {
	reviews: ReviewWithAuthor[];
	currentUserId?: string;
	likeCounts?: Map<string, number>;
	userLikes?: Set<string>;
}) {
	if (reviews.length === 0) {
		return <p className="text-sm text-muted-foreground">{m.review_empty()}</p>;
	}

	return (
		<div className="space-y-4">
			{reviews.map((review) => (
				<ReviewItem
					key={review.id}
					review={review}
					isOwner={currentUserId === review.authorId}
					isLiked={userLikes?.has(review.id) ?? false}
					likeCount={likeCounts?.get(review.id) ?? 0}
				/>
			))}
		</div>
	);
}
