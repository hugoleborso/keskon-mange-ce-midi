"use client";

import { useEffect, useRef, useState } from "react";
import * as m from "@/paraglide/messages.js";

export function DrawAnimation({ names, onComplete }: { names: string[]; onComplete: () => void }) {
	const [displayNames, setDisplayNames] = useState<string[]>([]);
	const [offset, setOffset] = useState(0);
	const [phase, setPhase] = useState<"spinning" | "decelerating" | "done">("spinning");
	const containerRef = useRef<HTMLDivElement>(null);
	const animationRef = useRef<number>(0);
	const startTimeRef = useRef(0);
	const skippedRef = useRef(false);

	useEffect(() => {
		if (names.length === 0) return;

		// Build a longer list by repeating names for the reel effect
		const repeatedNames: string[] = [];
		for (let i = 0; i < Math.max(30, names.length * 4); i++) {
			repeatedNames.push(names[i % names.length]);
		}
		setDisplayNames(repeatedNames);
		startTimeRef.current = performance.now();

		const spinDuration = 1200;
		const decelDuration = 1500;
		const totalDuration = spinDuration + decelDuration;
		const totalItems = repeatedNames.length;

		const animate = (now: number) => {
			if (skippedRef.current) return;

			const elapsed = now - startTimeRef.current;
			const progress = Math.min(elapsed / totalDuration, 1);

			if (progress < spinDuration / totalDuration) {
				setPhase("spinning");
				// Fast constant speed
				const spinProgress = elapsed / spinDuration;
				const itemOffset = spinProgress * totalItems * 0.5;
				setOffset(itemOffset);
			} else {
				setPhase("decelerating");
				// Ease-out deceleration
				const decelProgress = (elapsed - spinDuration) / decelDuration;
				const eased = 1 - (1 - decelProgress) ** 3;
				const baseOffset = totalItems * 0.5;
				const remainingOffset = totalItems * 0.3 * eased;
				setOffset(baseOffset + remainingOffset);
			}

			if (progress >= 1) {
				setPhase("done");
				onComplete();
				return;
			}

			animationRef.current = requestAnimationFrame(animate);
		};

		animationRef.current = requestAnimationFrame(animate);

		return () => cancelAnimationFrame(animationRef.current);
	}, [names, onComplete]);

	const handleSkip = () => {
		skippedRef.current = true;
		cancelAnimationFrame(animationRef.current);
		setPhase("done");
		onComplete();
	};

	const itemHeight = 48;
	const currentPixelOffset = offset * itemHeight;

	return (
		<div className="relative overflow-hidden rounded-xl bg-muted">
			{/* Reel container */}
			<div ref={containerRef} className="relative mx-auto h-[144px] overflow-hidden">
				{/* Gradient overlays for depth effect */}
				<div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-muted to-transparent" />
				<div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-muted to-transparent" />

				{/* Center highlight */}
				<div className="pointer-events-none absolute inset-x-4 top-1/2 z-10 h-12 -translate-y-1/2 rounded-lg border-2 border-primary/30 bg-primary/5" />

				{/* Scrolling names */}
				<div
					className="transition-none will-change-transform"
					style={{
						transform: `translateY(${48 - currentPixelOffset}px)`,
					}}
				>
					{displayNames.map((name, i) => {
						const key = `reel-${i.toString()}`;
						return (
							<div key={key} className="flex h-12 items-center justify-center text-lg font-bold">
								{name}
							</div>
						);
					})}
				</div>
			</div>

			{/* Skip button */}
			{phase !== "done" && (
				<button
					type="button"
					onClick={handleSkip}
					className="absolute right-2 top-2 z-20 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-background/50"
				>
					{m.draw_skip()}
				</button>
			)}
		</div>
	);
}
