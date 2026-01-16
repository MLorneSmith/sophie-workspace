"use client";

import { useEffect, useState } from "react";
import { isPerformanceApiError } from "../../lib/performance-api-error-handler";

interface ErrorPageProps {
	error: Error & { digest?: string };
	reset: () => void;
}

/**
 * Error Page for Payload CMS
 *
 * Catches errors during render, including Performance API errors from Next.js bug.
 * This error page is applied to the entire /admin route tree.
 *
 * See: https://github.com/vercel/next.js/issues/86060
 */
export default function PayloadErrorPage({ error, reset }: ErrorPageProps) {
	const [isPerformanceError] = useState(() => isPerformanceApiError(error));

	// Log the error for monitoring
	useEffect(() => {
		if (process.env.NODE_ENV === "development") {
			// biome-ignore lint/suspicious/noConsole: Intentional error logging for debugging
			console.error("[Payload Error Page] Error caught:", error);
		}
	}, [error]);

	// Auto-reset for Performance API errors
	useEffect(() => {
		if (!isPerformanceError) return;

		const timer = setTimeout(() => {
			reset();
		}, 500);

		return () => clearTimeout(timer);
	}, [isPerformanceError, reset]);

	// If it's a Performance API error, show minimal loading UI
	if (isPerformanceError) {
		return (
			<div
				style={{
					padding: "20px",
					textAlign: "center",
					minHeight: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<div>
					<h1 style={{ marginBottom: "10px" }}>Loading Payload Admin...</h1>
					<p style={{ color: "#666", marginBottom: "20px" }}>Initializing...</p>
				</div>
			</div>
		);
	}

	// For other errors, show error page
	return (
		<div
			style={{
				padding: "40px",
				textAlign: "center",
				minHeight: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: "#f5f5f5",
			}}
		>
			<div style={{ maxWidth: "500px" }}>
				<h1 style={{ fontSize: "24px", marginBottom: "10px", color: "#333" }}>
					Error
				</h1>
				<p style={{ marginBottom: "20px", color: "#666" }}>
					Something went wrong in Payload Admin. Please try refreshing the page.
				</p>

				{process.env.NODE_ENV === "development" && (
					<details
						style={{
							marginBottom: "20px",
							textAlign: "left",
							padding: "10px",
							backgroundColor: "#fff",
							border: "1px solid #ddd",
							borderRadius: "4px",
						}}
					>
						<summary
							style={{
								cursor: "pointer",
								fontWeight: "bold",
								marginBottom: "10px",
							}}
						>
							Error Details (Development Only)
						</summary>
						<pre
							style={{ overflow: "auto", fontSize: "12px", color: "#d63384" }}
						>
							{error.message}
						</pre>
						{error.stack && (
							<pre
								style={{
									overflow: "auto",
									fontSize: "11px",
									color: "#666",
									marginTop: "10px",
								}}
							>
								{error.stack}
							</pre>
						)}
					</details>
				)}

				<button
					type="button"
					onClick={() => reset()}
					style={{
						padding: "10px 20px",
						backgroundColor: "#007bff",
						color: "#fff",
						border: "none",
						borderRadius: "4px",
						cursor: "pointer",
						fontSize: "16px",
					}}
				>
					Try Again
				</button>
			</div>
		</div>
	);
}
