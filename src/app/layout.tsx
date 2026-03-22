import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { SessionProvider } from "@/providers/session-provider";
import { auth } from "@/server/auth";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
	title: "Keskon mange",
	description: "Mais on mange quoi ce midi ?",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const session = await auth();

	return (
		<html lang="fr" className={cn("font-sans", geist.variable)}>
			<body>
				<SessionProvider session={session}>{children}</SessionProvider>
				<Analytics />
			</body>
		</html>
	);
}
