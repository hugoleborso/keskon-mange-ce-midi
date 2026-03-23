import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AttendanceButton } from "@/components/attendance/attendance-button";
import { NavigateButton } from "@/components/restaurants/navigate-button";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewList } from "@/components/reviews/review-list";
import { PRICE_RANGE_LABELS } from "@/lib/constants";
import * as m from "@/paraglide/messages.js";
import { auth } from "@/server/auth";
import {
	getRestaurantAttendance,
	getTodayDateString,
	getUserAttendance,
} from "@/server/queries/attendance";
import { getRestaurantById } from "@/server/queries/restaurants";
import { getReviewLikeCounts, getUserReviewLikes } from "@/server/queries/review-likes";
import { getReviewsByRestaurant, getUserReview } from "@/server/queries/reviews";

export default async function RestaurantDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const [restaurant, session] = await Promise.all([getRestaurantById(id), auth()]);

	if (!restaurant) notFound();

	const today = getTodayDateString();

	const [reviews, userReview, attendees, userAttendingId] = await Promise.all([
		getReviewsByRestaurant(id),
		session?.user?.id ? getUserReview(id, session.user.id) : null,
		getRestaurantAttendance(id, today),
		session?.user?.id ? getUserAttendance(session.user.id, today) : null,
	]);

	const reviewIds = reviews.map((r) => r.id);
	const [likeCounts, userLikes] = await Promise.all([
		getReviewLikeCounts(reviewIds),
		session?.user?.id ? getUserReviewLikes(session.user.id, reviewIds) : new Set<string>(),
	]);

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
