import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AttendanceButton } from "@/components/attendance/attendance-button";
import { NavigateButton } from "@/components/restaurants/navigate-button";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewList } from "@/components/reviews/review-list";
import { PRICE_RANGE_LABELS } from "@/lib/constants";
import { serverFetch } from "@/lib/server-fetch";
import * as m from "@/paraglide/messages.js";
import { auth } from "@/server/auth";
import type { AttendanceUser } from "@/server/queries/attendance";
import type { RestaurantWithRating } from "@/server/queries/restaurants";
import type { ReviewWithAuthor } from "@/server/queries/reviews";

export default async function RestaurantDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const [restaurantRes, session] = await Promise.all([
		serverFetch(`/api/restaurants/${id}`),
		auth(),
	]);

	if (!restaurantRes.ok) notFound();

	const { data: restaurant } = (await restaurantRes.json()) as { data: RestaurantWithRating };

	const [reviewsRes, reviewLikesRes, attendeesRes, attMeRes, userReviewRes] = await Promise.all([
		serverFetch(`/api/reviews?restaurantId=${id}`),
		serverFetch(`/api/review-likes?restaurantId=${id}`),
		serverFetch(`/api/attendance?restaurantId=${id}`),
		serverFetch("/api/attendance/me"),
		serverFetch(`/api/reviews/me?restaurantId=${id}`),
	]);

	const { data: reviews } = (await reviewsRes.json()) as { data: ReviewWithAuthor[] };
	const { data: likesData } = (await reviewLikesRes.json()) as {
		data: { counts: Record<string, number>; userLikes: string[] };
	};
	const { data: attendees } = (await attendeesRes.json()) as { data: AttendanceUser[] };
	const { data: userAttendingId } = (await attMeRes.json()) as { data: string | null };
	const { data: userReview } = (await userReviewRes.json()) as { data: unknown };

	const likeCounts = new Map(Object.entries(likesData.counts));
	const userLikes = new Set(likesData.userLikes);

	// Collect all photos from reviews for a gallery
	const allPhotos = reviews.flatMap((r) => r.photoUrls ?? []);

	return (
		<main className="mx-auto max-w-2xl p-4">
			<Link href="/" className="mb-4 inline-block text-sm text-muted-foreground hover:underline">
				{m.restaurant_back_to_list()}
			</Link>

			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-2xl font-bold">{restaurant.name}</h1>
					<p className="text-muted-foreground">{restaurant.address}</p>
				</div>
				<Link
					href={`/restaurants/${restaurant.id}/edit`}
					className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
				>
					{m.restaurant_edit()}
				</Link>
			</div>

			{/* Attendance */}
			{session?.user && (
				<div className="mt-4">
					<AttendanceButton
						restaurantId={id}
						isAttending={userAttendingId === id}
						isAttendingOther={
							userAttendingId !== null && userAttendingId !== undefined && userAttendingId !== id
						}
						attendees={attendees}
					/>
				</div>
			)}

			<div className="mt-4 flex flex-wrap gap-2">
				{restaurant.restaurantType && (
					<span className="rounded-md bg-secondary px-2 py-1 text-sm">
						{restaurant.restaurantType}
					</span>
				)}
				{restaurant.priceRange && (
					<span className="rounded-md bg-secondary px-2 py-1 text-sm">
						{PRICE_RANGE_LABELS[restaurant.priceRange]}
					</span>
				)}
				{restaurant.dineIn && (
					<span className="rounded-md bg-secondary px-2 py-1 text-sm">
						{m.restaurant_dine_in()}
					</span>
				)}
				{restaurant.takeAway && (
					<span className="rounded-md bg-secondary px-2 py-1 text-sm">
						{m.restaurant_take_away()}
					</span>
				)}
			</div>

			{restaurant.labels && restaurant.labels.length > 0 && (
				<div className="mt-3 flex flex-wrap gap-1.5">
					{restaurant.labels.map((label) => (
						<span key={label} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
							{label}
						</span>
					))}
				</div>
			)}

			<div className="mt-4 text-sm text-muted-foreground">
				{restaurant.reviewsCount > 0
					? `⭐ ${restaurant.averageRating?.toFixed(1)} · ${m.restaurant_reviews({ count: restaurant.reviewsCount })}`
					: m.restaurant_no_reviews()}
			</div>

			{restaurant.latitude && restaurant.longitude && (
				<div className="mt-3 flex items-center gap-3">
					<Link
						href={`/?selected=${restaurant.id}`}
						className="text-sm text-primary hover:underline"
					>
						{m.map_view_on_map()}
					</Link>
					<NavigateButton latitude={restaurant.latitude} longitude={restaurant.longitude} />
				</div>
			)}

			{/* Photo gallery */}
			{allPhotos.length > 0 && (
				<section className="mt-6">
					<h2 className="mb-3 text-lg font-semibold">{m.restaurant_gallery()}</h2>
					<div className="flex flex-wrap gap-2">
						{allPhotos.map((url) => (
							<Image
								key={url}
								src={url}
								alt=""
								width={160}
								height={160}
								className="rounded-md object-cover"
								style={{ width: 160, height: 160 }}
							/>
						))}
					</div>
				</section>
			)}

			<section className="mt-8">
				<h2 className="mb-4 text-lg font-semibold">{m.review_section_title()}</h2>
				{session?.user && !userReview && (
					<div className="mb-6">
						<ReviewForm restaurantId={id} />
					</div>
				)}
				<ReviewList
					reviews={reviews}
					currentUserId={session?.user?.id}
					likeCounts={likeCounts}
					userLikes={userLikes}
				/>
			</section>
		</main>
	);
}
