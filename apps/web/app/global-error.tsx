"use client";

import { useEffect } from "react";

/**
 * Global error page - renders when the root layout itself fails.
 * Must be completely self-contained with NO external dependencies
 * since providers/context may have caused the error.
 *
 * Uses inline styles to avoid any Tailwind/CSS dependencies.
 */
const GlobalErrorPage = ({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) => {
	useEffect(() => {
		// biome-ignore lint/suspicious/noConsole: Error logging for debugging
		console.error("Global error:", error);
	}, [error]);

	return (
		<html lang="en">
			<head>
				<title>Error - SlideHeroes</title>
			</head>
			<body
				style={{
					margin: 0,
					padding: 0,
					fontFamily:
						'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
					backgroundColor: "#0a0a0a",
					color: "#fafafa",
					minHeight: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<div style={{ textAlign: "center", padding: "2rem" }}>
					<h1
						style={{
							fontSize: "6rem",
							fontWeight: 600,
							margin: "0 0 1rem 0",
							color: "#fafafa",
						}}
					>
						500
					</h1>

					<h2
						style={{
							fontSize: "1.5rem",
							fontWeight: 600,
							margin: "0 0 1rem 0",
						}}
					>
						Something went wrong
					</h2>

					<p
						style={{
							fontSize: "1rem",
							color: "#a1a1aa",
							margin: "0 0 2rem 0",
							maxWidth: "400px",
						}}
					>
						We encountered an unexpected error. Please try again or return to
						the home page.
					</p>

					{error.digest && (
						<p
							style={{
								fontSize: "0.875rem",
								color: "#71717a",
								margin: "0 0 2rem 0",
							}}
						>
							Error ID: {error.digest}
						</p>
					)}

					<div
						style={{ display: "flex", gap: "1rem", justifyContent: "center" }}
					>
						<button
							onClick={reset}
							type="button"
							style={{
								padding: "0.75rem 1.5rem",
								fontSize: "0.875rem",
								fontWeight: 500,
								backgroundColor: "#fafafa",
								color: "#0a0a0a",
								border: "none",
								borderRadius: "0.375rem",
								cursor: "pointer",
							}}
						>
							Try Again
						</button>

						<a
							href="/"
							style={{
								padding: "0.75rem 1.5rem",
								fontSize: "0.875rem",
								fontWeight: 500,
								backgroundColor: "transparent",
								color: "#fafafa",
								border: "1px solid #27272a",
								borderRadius: "0.375rem",
								textDecoration: "none",
								display: "inline-block",
							}}
						>
							Home
						</a>
					</div>
				</div>
			</body>
		</html>
	);
};

export default GlobalErrorPage;
