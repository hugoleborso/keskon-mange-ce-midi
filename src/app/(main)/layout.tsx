import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { MapProvider } from "@/providers/map-provider";

export default function MainLayout({ children }: { children: ReactNode }) {
	return (
		<NuqsAdapter>
			<MapProvider>
				<Header />
				{children}
			</MapProvider>
		</NuqsAdapter>
	);
}
