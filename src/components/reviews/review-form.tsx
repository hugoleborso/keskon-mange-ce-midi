"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import * as m from "@/paraglide/messages.js";
import { SubmitButton } from "../ui/submit-button";
import { StarRating } from "./star-rating";

const MAX_PHOTOS = 5;

export function ReviewForm({
	restaurantId,
	existingReview,
	onDone,
}: {
	restaurantId: string;
	existingReview?: {
		id: string;
		rating: number;
		comment: string | null;
		photoUrls: string[] | null;
	} | null;
	onDone?: () => void;
}) {
	const isEditing = !!existingReview;
	const [rating, setRating] = useState(existingReview?.rating ?? 0);
	const [photoUrls, setPhotoUrls] = useState<string[]>(existingReview?.photoUrls ?? []);
	const [uploading, setUploading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const formRef = useRef<HTMLFormElement>(null);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const fd = new FormData(e.currentTarget);
		const comment = fd.get("comment") as string | null;

		setSubmitting(true);
		try {
			if (isEditing) {
				await fetch("/api/reviews", {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						id: existingReview.id,
						rating,
						comment: comment || undefined,
						photoUrls,
					}),
				});
			} else {
				await fetch("/api/reviews", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						restaurantId,
						rating,
						comment: comment || undefined,
						photoUrls,
					}),
				});
				setRating(0);
				setPhotoUrls([]);
				formRef.current?.reset();
			}
			router.refresh();
			onDone?.();
		} finally {
			setSubmitting(false);
		}
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		const remaining = MAX_PHOTOS - photoUrls.length;
		const filesToUpload = Array.from(files).slice(0, remaining);

		setUploading(true);
		try {
			for (const file of filesToUpload) {
				const formData = new FormData();
				formData.set("file", file);

				const response = await fetch("/api/upload", {
					method: "POST",
					body: formData,
				});

				if (response.ok) {
					const { url } = await response.json();
					setPhotoUrls((prev) => [...prev, url]);
				}
			}
		} finally {
			setUploading(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	};

	const removePhoto = (index: number) => {
		setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
	};

	return (
		<form ref={formRef} onSubmit={handleSubmit} className="space-y-3 rounded-lg border p-4">
			<h3 className="font-semibold">{isEditing ? m.review_edit() : m.review_add()}</h3>
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

			{/* Photo upload */}
			<div className="space-y-2">
				{photoUrls.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{photoUrls.map((url, index) => (
							<div key={url} className="group relative">
								<Image
									src={url}
									alt={`Photo ${index + 1}`}
									width={80}
									height={80}
									className="rounded-md object-cover"
									style={{ width: 80, height: 80 }}
								/>
								<button
									type="button"
									onClick={() => removePhoto(index)}
									className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground"
								>
									x
								</button>
							</div>
						))}
					</div>
				)}
				{photoUrls.length < MAX_PHOTOS && (
					<label className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
						<input
							ref={fileInputRef}
							type="file"
							accept="image/jpeg,image/png,image/webp"
							multiple
							onChange={handleFileChange}
							className="hidden"
							disabled={uploading}
						/>
						{uploading ? m.review_uploading() : m.review_add_photos()}
					</label>
				)}
			</div>

			<SubmitButton
				disabled={rating === 0 || uploading || submitting}
				className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
			>
				{m.restaurant_save()}
			</SubmitButton>
		</form>
	);
}
