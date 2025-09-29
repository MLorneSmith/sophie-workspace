import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
	title: "SlideHeroes CMS",
	description: "Content Management System for SlideHeroes",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
