const shimmer = "animate-pulse bg-muted dark:bg-muted rounded-md";

export function HeroSkeleton() {
	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
			<div className={`h-12 w-3/4 max-w-2xl ${shimmer}`} />
			<div className={`h-6 w-1/2 max-w-xl ${shimmer}`} />
			<div className="flex gap-4">
				<div className={`h-12 w-36 rounded-full ${shimmer}`} />
				<div className={`h-12 w-36 rounded-full ${shimmer}`} />
			</div>
		</div>
	);
}

export function LogoCloudSkeleton() {
	return (
		<div className="flex items-center justify-center gap-8 py-8">
			{Array.from({ length: 5 }).map((_, i) => (
				<div key={i} className={`h-8 w-24 ${shimmer}`} />
			))}
		</div>
	);
}

export function StatisticsSkeleton() {
	return (
		<div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
			{Array.from({ length: 4 }).map((_, i) => (
				<div key={i} className="flex flex-col items-center gap-2">
					<div className={`h-10 w-20 ${shimmer}`} />
					<div className={`h-4 w-28 ${shimmer}`} />
				</div>
			))}
		</div>
	);
}

export function StickyScrollSkeleton() {
	return (
		<div className="space-y-4">
			<div className={`mx-auto h-10 w-2/3 ${shimmer}`} />
			<div className={`mx-auto h-5 w-1/2 ${shimmer}`} />
			<div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
				<div className="space-y-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className={`h-24 w-full ${shimmer}`} />
					))}
				</div>
				<div className={`h-80 w-full rounded-lg ${shimmer}`} />
			</div>
		</div>
	);
}

export function HowItWorksSkeleton() {
	return (
		<div className="space-y-6">
			<div className={`mx-auto h-10 w-1/2 ${shimmer}`} />
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="flex flex-col items-center gap-3">
						<div className={`h-16 w-16 rounded-full ${shimmer}`} />
						<div className={`h-6 w-32 ${shimmer}`} />
						<div className={`h-4 w-48 ${shimmer}`} />
					</div>
				))}
			</div>
		</div>
	);
}

export function FeaturesSkeleton() {
	return (
		<div className="space-y-4">
			<div className={`mx-auto h-10 w-2/3 ${shimmer}`} />
			<div className={`mx-auto h-5 w-1/2 ${shimmer}`} />
			<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<div key={i} className={`h-48 w-full rounded-xl ${shimmer}`} />
				))}
			</div>
		</div>
	);
}

export function ComparisonSkeleton() {
	return (
		<div className="space-y-4">
			<div className={`mx-auto h-10 w-1/2 ${shimmer}`} />
			<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<div className={`h-72 w-full rounded-xl ${shimmer}`} />
				<div className={`h-72 w-full rounded-xl ${shimmer}`} />
			</div>
		</div>
	);
}

export function TestimonialsSkeleton() {
	return (
		<div className="space-y-4">
			<div className={`mx-auto h-10 w-1/2 ${shimmer}`} />
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className={`h-48 w-full rounded-xl ${shimmer}`} />
				))}
			</div>
		</div>
	);
}

export function PricingSkeleton() {
	return (
		<div className="space-y-6">
			<div className={`mx-auto h-10 w-1/3 ${shimmer}`} />
			<div className={`mx-auto h-5 w-1/2 ${shimmer}`} />
			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className={`h-96 w-full rounded-xl ${shimmer}`} />
				))}
			</div>
		</div>
	);
}

export function BlogSkeleton() {
	return (
		<div className="space-y-4">
			<div className={`mx-auto h-10 w-1/3 ${shimmer}`} />
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 3 }).map((_, i) => (
					<div key={i} className="space-y-3">
						<div className={`h-40 w-full rounded-lg ${shimmer}`} />
						<div className={`h-5 w-3/4 ${shimmer}`} />
						<div className={`h-4 w-1/2 ${shimmer}`} />
					</div>
				))}
			</div>
		</div>
	);
}

export function CtaSkeleton() {
	return (
		<div className="flex flex-col items-center gap-6 py-12">
			<div className={`h-12 w-2/3 max-w-lg ${shimmer}`} />
			<div className={`h-6 w-1/2 max-w-md ${shimmer}`} />
			<div className={`h-12 w-40 rounded-full ${shimmer}`} />
		</div>
	);
}
