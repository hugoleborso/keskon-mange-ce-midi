"use client";

import * as m from "@/paraglide/messages.js";

export function DrawButton({ onDraw, disabled }: { onDraw: () => void; disabled: boolean }) {
	return (
		<button
			type="button"
			onClick={onDraw}
			disabled={disabled}
			className="w-full rounded-xl bg-primary px-6 py-4 text-lg font-bold text-primary-foreground shadow-lg transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50"
		>
			{m.draw_button()}
		</button>
	);
}
