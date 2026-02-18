/**
 * Payload-style structural grid lines that run the full page height.
 * Two vertical lines aligned with the header/navigation container edges (max-w-7xl + padding).
 * Visible in dark mode only.
 */
export function GridLines() {
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none fixed inset-0 z-[5] mx-auto hidden w-full max-w-7xl px-4 dark:block sm:px-6 lg:px-8"
		>
			{/* Left vertical line */}
			<div className="absolute top-0 bottom-0 left-4 w-px bg-white/[0.06] sm:left-6 lg:left-8" />
			{/* Right vertical line */}
			<div className="absolute top-0 right-4 bottom-0 w-px bg-white/[0.06] sm:right-6 lg:right-8" />
		</div>
	);
}
