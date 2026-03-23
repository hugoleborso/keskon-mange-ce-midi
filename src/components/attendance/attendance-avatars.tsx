import Image from "next/image";
import type { AttendanceUser } from "@/server/queries/attendance";

export function AttendanceAvatars({ users }: { users: AttendanceUser[] }) {
	if (users.length === 0) return null;

	return (
		<div className="flex items-center -space-x-1.5">
			{users.slice(0, 5).map((user) => (
				<div key={user.userId} title={user.name ?? undefined} className="relative">
					{user.image ? (
						<Image
							src={user.image}
							alt={user.name ?? ""}
							width={24}
							height={24}
							className="rounded-full border-2 border-background"
						/>
					) : (
						<div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
							{user.name?.charAt(0) ?? "?"}
						</div>
					)}
				</div>
			))}
			{users.length > 5 && (
				<div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
					+{users.length - 5}
				</div>
			)}
		</div>
	);
}
