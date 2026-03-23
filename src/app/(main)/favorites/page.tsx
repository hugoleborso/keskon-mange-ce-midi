import Link from "next/link";
import { AttendanceButton } from "@/components/attendance/attendance-button";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { RestaurantCard } from "@/components/restaurants/restaurant-card";
import * as m from "@/paraglide/messages.js";
import { auth } from "@/server/auth";
import {
	getAllAttendanceForDate,
	getTodayDateString,
	getUserAttendance,
} from "@/server/queries/attendance";
import { getUserFavoriteRestaurants } from "@/server/queries/favorites";

export default async function FavoritesPage() {
	const session = await auth();
	if (!session?.user?.id) return null;

	const today = getTodayDateString();

	const [restaurants, attendanceMap, userAttendingId] = await Promise.all([
		getUserFavoriteRestaurants(session.user.id),
		getAllAttendanceForDate(today),
		getUserAttendance(session.user.id, today),
	]);

	const attendanceData: Record<
		string,
		{ userId: string; name: string | null; image: string | null }[]
	> = {};
	for (const [restaurantId, users] of attendanceMap) {
		attendanceData[restaurantId] = users;
	}

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
