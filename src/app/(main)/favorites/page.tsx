import Link from "next/link";
import { AttendanceButton } from "@/components/attendance/attendance-button";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { RestaurantCard } from "@/components/restaurants/restaurant-card";
import { serverFetch } from "@/lib/server-fetch";
import * as m from "@/paraglide/messages.js";
import { auth } from "@/server/auth";
import type { AttendanceUser } from "@/server/queries/attendance";
import type { RestaurantWithRating } from "@/server/queries/restaurants";

export default async function FavoritesPage() {
	const session = await auth();
	if (!session?.user?.id) return null;

	const [favRes, attAllRes, attMeRes] = await Promise.all([
		serverFetch("/api/favorites/restaurants"),
		serverFetch("/api/attendance/all"),
		serverFetch("/api/attendance/me"),
	]);

	const { data: restaurants } = (await favRes.json()) as { data: RestaurantWithRating[] };
	const { data: attendanceData } = (await attAllRes.json()) as {
		data: Record<string, AttendanceUser[]>;
	};
	const { data: userAttendingId } = (await attMeRes.json()) as { data: string | null };

	return (
		<main className="mx-auto max-w-2xl p-4">
			<h1 className="mb-4 text-2xl font-bold">{m.favorites_title()}</h1>
			{restaurants.length === 0 ? (
				<div className="flex flex-col items-center gap-4 py-12 text-center">
					<p className="text-muted-foreground">{m.favorites_empty()}</p>
					<Link href="/" className="text-primary hover:underline">
						{m.favorites_empty_cta()}
					</Link>
				</div>
			) : (
				<div className="grid gap-3">
					{restaurants.map((restaurant) => (
						<RestaurantCard
							key={restaurant.id}
							restaurant={restaurant}
							favoriteButton={<FavoriteButton restaurantId={restaurant.id} isFavorite />}
							attendanceSlot={
								<AttendanceButton
									restaurantId={restaurant.id}
									isAttending={userAttendingId === restaurant.id}
									isAttendingOther={
										userAttendingId !== null &&
										userAttendingId !== undefined &&
										userAttendingId !== restaurant.id
									}
									attendees={attendanceData[restaurant.id] ?? []}
								/>
							}
						/>
					))}
				</div>
			)}
		</main>
	);
}
