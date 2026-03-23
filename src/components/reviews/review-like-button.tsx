"use client";

import { Heart } from "lucide-react";
import { toggleReviewLike } from "@/server/actions/review-likes";
import { SubmitButton } from "../ui/submit-button";

export function ReviewLikeButton({
	reviewId,
	isLiked,
	likeCount,
}: {
	reviewId: string;
	isLiked: boolean;
	likeCount: number;
}) {
	return (
		<form action={toggleReviewLike} className="inline-flex">
			<input type="hidden" name="reviewId" value={reviewId} />
			<SubmitButton className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
				<Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
				{likeCount > 0 && <span>{likeCount}</span>}
			</SubmitButton>
		</form>
	);
}
