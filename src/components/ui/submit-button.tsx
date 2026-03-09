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
		<button type="submit" disabled={disabled || pending} className={className}>
			{pending ? <Loader2 className="inline h-4 w-4 animate-spin" /> : children}
		</button>
	);
}
