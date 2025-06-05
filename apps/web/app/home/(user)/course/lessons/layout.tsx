import { Suspense } from "react";

/**
 * Layout for course lessons
 * Authentication is handled by middleware, not in this layout
 */
export default function LessonsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<Suspense
			fallback={
				<div className="container mx-auto p-8 text-center">
					<div className="animate-pulse">
						<div className="mx-auto mb-4 h-8 w-1/3 rounded bg-gray-200" />
						<div className="mx-auto mb-2 h-4 w-1/2 rounded bg-gray-200" />
						<div className="mx-auto h-64 w-full rounded bg-gray-200" />
					</div>
				</div>
			}
		>
			{children}
		</Suspense>
	);
}
