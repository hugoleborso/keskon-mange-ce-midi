"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import * as m from "@/paraglide/messages.js";
import type { AttendanceUser } from "@/server/queries/attendance";
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
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	const handleToggle = () => {
		startTransition(async () => {
			await fetch("/api/attendance", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ restaurantId }),
			});
			router.refresh();
		});
	};

	return (
		<div className="flex items-center gap-2">
			<button
				type="button"
				disabled={isPending}
				onClick={handleToggle}
				className={`rounded-full px-3 py-1 text-sm font-medium transition-colors disabled:opacity-50 ${
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
			</button>
			<AttendanceAvatars users={attendees} />
			{attendees.length > 0 && (
				<span className="text-xs text-muted-foreground">
					{m.attendance_people_going({ count: attendees.length })}
				</span>
			)}
		</div>
	);
}
