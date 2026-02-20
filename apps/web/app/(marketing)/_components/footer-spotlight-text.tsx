"use client";

import {
	motion,
	useMotionTemplate,
	useMotionValue,
	useReducedMotion,
} from "motion/react";
import { type MouseEvent as ReactMouseEvent, useState } from "react";

const SLIDE_LETTERS = [
	{ key: "S0", char: "S" },
	{ key: "L1", char: "L" },
	{ key: "I2", char: "I" },
	{ key: "D3", char: "D" },
	{ key: "E4", char: "E" },
];
const HEROES_LETTERS = [
	{ key: "H0", char: "H" },
	{ key: "E1", char: "E" },
	{ key: "R2", char: "R" },
	{ key: "O3", char: "O" },
	{ key: "E4", char: "E" },
	{ key: "S5", char: "S" },
];

export function FooterSpotlightText() {
	const mouseX = useMotionValue(0);
	const mouseY = useMotionValue(0);
	const [revealCount, setRevealCount] = useState(0);
	const [isHovering, setIsHovering] = useState(false);
	const prefersReducedMotion = useReducedMotion();

	function handleMouseMove({
		currentTarget,
		clientX,
		clientY,
	}: ReactMouseEvent<HTMLDivElement>) {
		if (prefersReducedMotion) return;
		const { left, top, width } = currentTarget.getBoundingClientRect();
		mouseX.set(clientX - left);
		mouseY.set(clientY - top);
		const percent = (clientX - left) / width;
		setRevealCount(
			Math.max(
				0,
				Math.min(
					HEROES_LETTERS.length,
					Math.floor(percent * (HEROES_LETTERS.length + 1)),
				),
			),
		);
	}

	const maskImage = useMotionTemplate`radial-gradient(350px circle at ${mouseX}px ${mouseY}px, white, transparent 80%)`;

	return (
		<div className="hidden dark:block" aria-hidden="true">
			{/* biome-ignore lint/a11y/noStaticElementInteractions: decorative mouse tracking for spotlight effect */}
			<div
				className="container mx-auto"
				onMouseMove={handleMouseMove}
				onMouseEnter={() => setIsHovering(true)}
				onMouseLeave={() => {
					setIsHovering(false);
					setRevealCount(0);
				}}
			>
				<div className="relative -mx-16 h-[16vw] overflow-hidden px-16 select-none">
					{/* Base SLIDE — individual letters, each fades out when replaced */}
					<span className="mt-[2.5vw] block text-center font-bold leading-none tracking-[0.24em] text-[17vw]">
						{SLIDE_LETTERS.map(({ key, char }, i) => (
							<motion.span
								key={`slide-${key}`}
								animate={{ opacity: i < revealCount ? 0 : 0.12 }}
								transition={{ duration: 0.15 }}
								className="inline bg-[length:150px] bg-repeat bg-clip-text text-transparent"
								style={{
									backgroundImage:
										"url('/images/noise.png'), linear-gradient(#aaa, #aaa)",
								}}
							>
								{char}
							</motion.span>
						))}
					</span>

					{/* Spotlight glow on SLIDE — masked to cursor, letters hide individually */}
					{!prefersReducedMotion && (
						<motion.span
							initial={false}
							animate={{ opacity: isHovering ? 1 : 0 }}
							transition={{ duration: 0.3 }}
							className="pointer-events-none absolute inset-0 mt-[2.5vw] block text-center font-bold leading-none tracking-[0.24em] text-[17vw]"
							style={{
								maskImage,
								WebkitMaskImage: maskImage,
							}}
						>
							{SLIDE_LETTERS.map(({ key, char }, i) => (
								<motion.span
									key={`slide-glow-${key}`}
									animate={{ opacity: i < revealCount ? 0 : 1 }}
									transition={{ duration: 0.15 }}
									className="inline text-[#24a9e0]/[0.14]"
								>
									{char}
								</motion.span>
							))}
						</motion.span>
					)}

					{/* HEROES — letters revealed left-to-right by cursor position */}
					<span className="pointer-events-none absolute inset-0 mt-[2.5vw] block text-center font-bold leading-none text-[17vw]">
						{HEROES_LETTERS.map(({ key, char }, i) => (
							<motion.span
								key={`hero-${key}`}
								animate={{ opacity: i < revealCount ? 0.25 : 0 }}
								transition={{ duration: 0.2 }}
								className="inline bg-[length:150px] bg-repeat bg-clip-text text-transparent"
								style={{
									backgroundImage:
										"url('/images/noise.png'), linear-gradient(#aaa, #aaa)",
								}}
							>
								{char}
							</motion.span>
						))}
					</span>
				</div>
			</div>
		</div>
	);
}
