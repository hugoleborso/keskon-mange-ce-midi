import * as m from "@/paraglide/messages.js";
import type { ReviewWithAuthor } from "@/server/queries/reviews";
import { ReviewItem } from "./review-item";

export function ReviewList({
	reviews,
	currentUserId,
}: {
	reviews: ReviewWithAuthor[];
	currentUserId?: string;
}) {
	if (reviews.length === 0) {
		return <p className="text-sm text-muted-foreground">{m.review_empty()}</p>;
	}

	return (
		<div className="space-y-4">
			{reviews.map((review) => (
				<ReviewItem key={review.id} review={review} isOwner={currentUserId === review.authorId} />
			))}
		</div>
	);
}
