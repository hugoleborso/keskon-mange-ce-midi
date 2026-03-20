import Image from "next/image";
import * as m from "@/paraglide/messages.js";
import { deleteReview } from "@/server/actions/reviews";
import type { ReviewWithAuthor } from "@/server/queries/reviews";
import { SubmitButton } from "../ui/submit-button";
import { StarRating } from "./star-rating";

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
				<div key={review.id} className="rounded-lg border p-4">
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
						{currentUserId === review.authorId && (
							<form action={deleteReview}>
								<input type="hidden" name="id" value={review.id} />
								<SubmitButton className="text-xs text-destructive hover:underline">
									{m.review_delete()}
								</SubmitButton>
							</form>
						)}
					</div>
					<div className="mt-2">
						<StarRating value={review.rating} readOnly />
					</div>
					{review.comment && <p className="mt-2 text-sm">{review.comment}</p>}
				</div>
			))}
		</div>
	);
}
