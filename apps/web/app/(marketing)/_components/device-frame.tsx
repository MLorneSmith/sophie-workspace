interface DeviceFrameProps {
	children: React.ReactNode;
	title?: string;
	className?: string;
}

export function DeviceFrame({
	children,
	title = "SlideHeroes",
	className,
}: DeviceFrameProps) {
	return (
		<div
			className={`overflow-hidden rounded-xl border border-white/10 bg-gray-900/80 shadow-2xl backdrop-blur-sm ${className ?? ""}`}
		>
			{/* Title bar */}
			<div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
				{/* Traffic light dots */}
				<div className="flex gap-1.5">
					<span className="size-3 rounded-full bg-red-500/80" />
					<span className="size-3 rounded-full bg-yellow-500/80" />
					<span className="size-3 rounded-full bg-green-500/80" />
				</div>
				<span className="ml-2 text-xs text-white/40">{title}</span>
			</div>
			{/* Content area */}
			<div className="relative">{children}</div>
		</div>
	);
}
