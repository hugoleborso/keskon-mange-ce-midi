"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
	children,
	disabled,
	className,
}: {
	children: React.ReactNode;
	disabled?: boolean;
	className?: string;
}) {
	const { pending } = useFormStatus();

	return (
		<button type="submit" disabled={disabled || pending} className={`relative ${className ?? ""}`}>
			<span className={pending ? "invisible" : ""}>{children}</span>
			{pending && (
				<span className="absolute inset-0 flex items-center justify-center">
					<Loader2 className="h-4 w-4 animate-spin" />
				</span>
			)}
		</button>
	);
}
