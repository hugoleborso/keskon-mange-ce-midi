"use client";

import { useEffect, useState } from "react";

export function DrawAnimation({ names, onComplete }: { names: string[]; onComplete: () => void }) {
	const [currentIndex, setCurrentIndex] = useState(0);

	useEffect(() => {
		if (names.length === 0) return;

		let iteration = 0;
		const totalIterations = 20;

		const tick = () => {
			iteration++;
			setCurrentIndex((prev) => (prev + 1) % names.length);

			if (iteration >= totalIterations) {
				onComplete();
				return;
			}

			// Decelerate: interval increases as we get closer to the end
			const delay = 80 + iteration * 15;
			timeout = setTimeout(tick, delay);
		};

		let timeout = setTimeout(tick, 80);

		return () => clearTimeout(timeout);
	}, [names, onComplete]);

	return (
		<div className="flex items-center justify-center rounded-xl bg-muted py-6">
			<span className="text-xl font-bold">{names[currentIndex] ?? ""}</span>
		</div>
	);
}
