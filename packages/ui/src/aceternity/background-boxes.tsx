"use client";

import { motion } from "framer-motion";
import React from "react";

import { cn } from "../lib/utils";

interface BoxesProps extends React.HTMLAttributes<HTMLDivElement> {
	className?: string;
	children?: React.ReactNode;
}

export const BoxesCore = ({ className, children, ...rest }: BoxesProps) => {
	const rows = new Array(150).fill(1);
	const cols = new Array(100).fill(1);

	// Company colors with higher opacity for better visibility
	const colors = [
		// Blue variations (#24a9e0)
		"hsl(198, 60%, 82%, 0.85)", // Very light pastel blue
		"hsl(198, 65%, 78%, 0.85)", // Light pastel blue
		"hsl(198, 70%, 75%, 0.85)", // Pastel blue
		// Red variations (#c63b45)
		"hsl(356, 50%, 82%, 0.85)", // Very light pastel red
		"hsl(356, 55%, 78%, 0.85)", // Light pastel red
		"hsl(356, 60%, 75%, 0.85)", // Pastel red
		// Green variations (#0a6e27)
		"hsl(140, 40%, 82%, 0.85)", // Very light pastel green
		"hsl(140, 45%, 78%, 0.85)", // Light pastel green
		"hsl(140, 50%, 75%, 0.85)", // Pastel green
		// Yellow variations
		"hsl(48, 70%, 85%, 0.85)", // Very light pastel yellow
		"hsl(48, 75%, 82%, 0.85)", // Light pastel yellow
		"hsl(48, 80%, 78%, 0.85)", // Pastel yellow
		// Orange variations
		"hsl(32, 65%, 82%, 0.85)", // Very light pastel orange
		"hsl(32, 70%, 78%, 0.85)", // Light pastel orange
		"hsl(32, 75%, 75%, 0.85)", // Pastel orange
	];

	const getRandomColor = () => {
		return colors[Math.floor(Math.random() * colors.length)];
	};

	return (
		<div
			className={cn(
				"relative flex h-[70vh] w-full flex-col items-center justify-center overflow-hidden bg-transparent",
				className,
			)}
			{...rest}
		>
			<div className="relative z-0 h-full w-full">
				<div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,transparent_0%,#fff_75%)] opacity-90 dark:bg-[radial-gradient(circle_at_center,transparent_0%,rgb(2,6,23)_75%)]" />
				<div
					style={{
						transform:
							"translate(-30%,-32%) skewX(-48deg) skewY(14deg) scale(0.9) rotate(0deg) translateZ(0)",
						transformStyle: "preserve-3d",
					}}
					className="absolute -top-1/4 left-1/4 z-0 flex h-[500%] w-[200%] -translate-x-1/2 -translate-y-1/2"
				>
					{rows.map((_, i) => (
						<motion.div
							key={`row-${i}`}
							style={{
								position: "relative",
								height: "2rem",
								width: "4rem",
							}}
						>
							{cols.map((_, j) => (
								<motion.div
									whileHover={{
										backgroundColor: getRandomColor(),
										opacity: 1,
										scale: 1.05,
										transition: { duration: 0 },
										boxShadow: "none",
									}}
									animate={{
										transition: { duration: 2 },
									}}
									key={`col-${j}`}
									style={{
										position: "relative",
										height: "2rem",
										width: "4rem",
										cursor: "crosshair",
										WebkitTapHighlightColor: "transparent",
										boxShadow: `
                      inset -1px -1px 0 0 rgba(148, 163, 184, 0.4)
                    `,
									}}
								>
									{j % 2 === 0 && i % 2 === 0 ? (
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth="1"
											stroke="currentColor"
											aria-hidden="true"
											style={{
												position: "absolute",
												left: "-12px",
												top: "-12px",
												height: "24px",
												width: "24px",
												pointerEvents: "none",
												color: "rgba(148, 163, 184, 0.45)",
											}}
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M12 6v12m6-6H6"
											/>
										</svg>
									) : null}
								</motion.div>
							))}
						</motion.div>
					))}
				</div>
			</div>
			{children && (
				<div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
					<div className="pointer-events-auto mx-auto max-w-5xl px-4">
						{children}
					</div>
				</div>
			)}
		</div>
	);
};

export const BackgroundBoxes = React.memo(BoxesCore);
