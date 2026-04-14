"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function ReviewLikeButton({
	reviewId,
	isLiked,
	likeCount,
}: {
	reviewId: string;
	isLiked: boolean;
	likeCount: number;
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const handleToggle = () => {
		startTransition(async () => {
			await fetch("/api/review-likes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ reviewId }),
			});
			router.refresh();
		});
	};

	return (
		<button
			type="button"
			disabled={isPending}
			onClick={handleToggle}
			className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
		>
			<Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
			{likeCount > 0 && <span>{likeCount}</span>}
		</button>
	);
}
