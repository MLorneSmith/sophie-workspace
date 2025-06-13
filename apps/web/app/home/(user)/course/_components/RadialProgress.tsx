"use client";

interface RadialProgressProps {
	value: number;
	size?: number;
	strokeWidth?: number;
}

export function RadialProgress({
	value,
	size = 40,
	strokeWidth = 4,
}: RadialProgressProps) {
	const radius = (size - strokeWidth) / 2;
	const circumference = radius * 2 * Math.PI;
	const offset = circumference - (value / 100) * circumference;

	return (
		<div className="relative" style={{ width: size, height: size }}>
			<svg
				className="-rotate-90 transform"
				width={size}
				height={size}
				viewBox={`0 0 ${size} ${size}`}
			>
				<title>Course Progress: {value.toFixed(1)}% complete</title>
				{/* Background circle */}
				<circle
					className="text-muted-foreground/20"
					strokeWidth={strokeWidth}
					stroke="currentColor"
					fill="transparent"
					r={radius}
					cx={size / 2}
					cy={size / 2}
				/>
				{/* Progress circle */}
				<circle
					className="text-primary transition-all duration-300 ease-in-out"
					strokeWidth={strokeWidth}
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					strokeLinecap="round"
					stroke="currentColor"
					fill="transparent"
					r={radius}
					cx={size / 2}
					cy={size / 2}
				/>
			</svg>
			<div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
				{Math.round(value)}%
			</div>
		</div>
	);
}
