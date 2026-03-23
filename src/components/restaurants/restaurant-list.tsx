import Link from "next/link";
import { AttendanceButton } from "@/components/attendance/attendance-button";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import * as m from "@/paraglide/messages.js";
import type { AttendanceUser } from "@/server/queries/attendance";
import type { RestaurantWithRating } from "@/server/queries/restaurants";
import { RestaurantCard } from "./restaurant-card";
import { RestaurantCardWrapper } from "./restaurant-card-wrapper";

export function RestaurantList({
	restaurants,
	favoriteIds = [],
	attendanceData = {},
	userAttendingId,
	isAuthenticated = false,
}: {
	restaurants: RestaurantWithRating[];
	favoriteIds?: string[];
	attendanceData?: Record<string, AttendanceUser[]>;
	userAttendingId?: string | null;
	isAuthenticated?: boolean;
}) {
	if (restaurants.length === 0) {
		return (
			<div className="flex flex-col items-center gap-4 py-12 text-center">
				<p className="text-muted-foreground">{m.restaurants_empty()}</p>
				<Link href="/restaurants/new" className="text-primary hover:underline">
					{m.restaurants_empty_cta()}
				</Link>
			</div>
		);
	}

	return (
		<div className="grid gap-3">
			{restaurants.map((restaurant) => (
				<RestaurantCardWrapper key={restaurant.id} restaurantId={restaurant.id}>
					<RestaurantCard
						restaurant={restaurant}
						favoriteButton={
							<FavoriteButton
								restaurantId={restaurant.id}
								isFavorite={favoriteIds.includes(restaurant.id)}
							/>
						}
						attendanceSlot={
							isAuthenticated ? (
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
							) : undefined
						}
					/>
				</RestaurantCardWrapper>
			))}
		</div>
	);
}
