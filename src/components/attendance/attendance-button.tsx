"use client";

import * as m from "@/paraglide/messages.js";
import { toggleAttendance } from "@/server/actions/attendance";
import type { AttendanceUser } from "@/server/queries/attendance";
import { SubmitButton } from "../ui/submit-button";
import { AttendanceAvatars } from "./attendance-avatars";

export function AttendanceButton({
	restaurantId,
	isAttending,
	isAttendingOther,
	attendees,
}: {
	restaurantId: string;
	isAttending: boolean;
	isAttendingOther: boolean;
	attendees: AttendanceUser[];
}) {
	return (
		<div className="flex items-center gap-2">
			<form action={toggleAttendance}>
				<input type="hidden" name="restaurantId" value={restaurantId} />
				<SubmitButton
					className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
						isAttending
							? "bg-foreground text-background hover:bg-foreground/80"
							: "border border-foreground/20 text-foreground hover:bg-foreground/10"
					}`}
				>
					{isAttending
						? m.attendance_going()
						: isAttendingOther
							? m.attendance_go()
							: m.attendance_go()}
				</SubmitButton>
			</form>
			<AttendanceAvatars users={attendees} />
			{attendees.length > 0 && (
				<span className="text-xs text-muted-foreground">
					{m.attendance_people_going({ count: attendees.length })}
				</span>
			)}
		</div>
	);
}
