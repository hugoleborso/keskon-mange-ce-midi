import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Keskon mange",
	description: "Mais on mange quoi ce midi ?",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="fr">
			<body>{children}</body>
		</html>
	);
}
