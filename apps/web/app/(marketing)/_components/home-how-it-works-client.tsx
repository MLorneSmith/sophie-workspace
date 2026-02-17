"use client";

import {
	GitBranch,
	Layers,
	LayoutPanelTop,
	type LucideIcon,
	Rocket,
	Target,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Fragment } from "react";

import type { HowItWorksStep } from "~/config/homepage-content.config";

const iconMap: Record<string, LucideIcon> = {
	Target,
	Layers,
	GitBranch,
	LayoutPanelTop,
	Rocket,
};

const STEP_COLORS = ["#2431E0", "#246CE0", "#24A9E0", "#24E0DD", "#24E09D"];

function hexToRgba(hex: string, alpha: number) {
	const r = Number.parseInt(hex.slice(1, 3), 16);
	const g = Number.parseInt(hex.slice(3, 5), 16);
	const b = Number.parseInt(hex.slice(5, 7), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function FlowArrow({
	index,
	fromColor,
	toColor,
	reduced,
}: {
	index: number;
	fromColor: string;
	toColor: string;
	reduced: boolean;
}) {
	return (
		<div
			className="flex items-center justify-center self-center"
			aria-hidden="true"
		>
			<motion.div
				className="flex items-center gap-0.5"
				animate={!reduced ? { x: [0, 3, 0] } : undefined}
				transition={{
					duration: 2,
					repeat: Number.POSITIVE_INFINITY,
					ease: "easeInOut",
					delay: index * 0.4,
				}}
			>
				{/* Line */}
				<motion.div
					className="h-0.5 rounded-full"
					style={{
						background: `linear-gradient(to right, ${fromColor}, ${toColor})`,
						width: 20,
					}}
					initial={reduced ? undefined : { scaleX: 0, opacity: 0 }}
					whileInView={{ scaleX: 1, opacity: 1 }}
					transition={{
						duration: 0.4,
						delay: (index + 1) * 0.15 + 0.3,
					}}
					viewport={{ once: true }}
				/>
				{/* Arrowhead */}
				<motion.svg
					viewBox="0 0 12 12"
					className="h-3 w-3"
					fill="none"
					initial={reduced ? undefined : { opacity: 0, x: -4 }}
					whileInView={{ opacity: 1, x: 0 }}
					transition={{
						duration: 0.3,
						delay: (index + 1) * 0.15 + 0.5,
					}}
					viewport={{ once: true }}
				>
					<polygon points="0,0 12,6 0,12" fill={toColor} />
				</motion.svg>
			</motion.div>
		</div>
	);
}

interface HowItWorksProps {
	title: string;
	subtitle: string;
	steps: HowItWorksStep[];
}

export function HomeHowItWorks({ title, subtitle, steps }: HowItWorksProps) {
	const prefersReducedMotion = useReducedMotion();
	const reduced = !!prefersReducedMotion;

	return (
		<div className="w-full">
			<h2 className="text-h3 sm:text-h2 mb-3 text-center text-foreground sm:mb-4">
				{title}
			</h2>
			<p className="mx-auto mb-10 max-w-3xl text-center text-lg leading-relaxed text-muted-foreground sm:mb-14 sm:text-xl">
				{subtitle}
			</p>

			{/* Desktop: 9-column grid with arrows in gap columns */}
			<div className="hidden md:block">
				<div
					className="mt-4 grid items-stretch gap-y-0"
					style={{
						gridTemplateColumns: "1fr 40px 1fr 40px 1fr 40px 1fr 40px 1fr",
						gap: 0,
					}}
				>
					{steps.map((step, i) => {
						const color = STEP_COLORS[i] ?? STEP_COLORS[0]!;
						const Icon = iconMap[step.iconName];

						return (
							<Fragment key={step.stepNumber}>
								{/* Arrow before this card (except the first) */}
								{i > 0 && (
									<FlowArrow
										key={`arrow-${i}`}
										index={i - 1}
										fromColor={STEP_COLORS[i - 1] ?? STEP_COLORS[0]!}
										toColor={color}
										reduced={reduced}
									/>
								)}

								<motion.div
									key={step.stepNumber}
									className="relative flex cursor-default flex-col items-center rounded-2xl bg-white/5 pt-8 pr-5 pb-5 pl-5 backdrop-blur-xl lg:pt-9 lg:pr-6 lg:pb-6 lg:pl-6"
									style={{
										border: `1px solid ${hexToRgba(color, 0.25)}`,
									}}
									initial={reduced ? undefined : { opacity: 0, y: 24 }}
									whileInView={{ opacity: 1, y: 0 }}
									whileHover={{
										y: -4,
										boxShadow: `0 8px 30px ${hexToRgba(color, 0.3)}`,
										borderColor: hexToRgba(color, 0.5),
										transition: {
											type: "spring",
											stiffness: 400,
											damping: 20,
										},
									}}
									transition={{
										duration: 0.5,
										delay: i * 0.12,
									}}
									viewport={{ once: true, amount: 0.3 }}
								>
									{/* Step badge - half outside card */}
									<span
										className="absolute -top-4 left-1/2 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg"
										style={{
											background: `linear-gradient(135deg, ${color}, ${hexToRgba(color, 0.7)})`,
										}}
									>
										{step.stepNumber}
									</span>

									{/* Icon with spring entry + float */}
									<motion.div
										className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl"
										style={{
											backgroundColor: hexToRgba(color, 0.12),
										}}
										initial={
											reduced
												? undefined
												: {
														opacity: 0,
														scale: 0,
														y: 8,
													}
										}
										whileInView={{
											opacity: 1,
											scale: 1,
											y: 0,
										}}
										transition={{
											duration: 0.5,
											delay: i * 0.12 + 0.15,
											type: "spring",
											bounce: 0.5,
										}}
										viewport={{ once: true }}
									>
										{Icon &&
											(!reduced ? (
												<motion.div
													animate={{
														y: [0, -3, 0],
													}}
													transition={{
														duration: 3 + i * 0.4,
														repeat: Number.POSITIVE_INFINITY,
														ease: "easeInOut",
													}}
												>
													<Icon className="h-7 w-7" style={{ color }} />
												</motion.div>
											) : (
												<Icon className="h-7 w-7" style={{ color }} />
											))}
									</motion.div>

									<h3 className="mb-2 text-center text-base font-semibold text-white lg:text-lg">
										{step.title}
									</h3>

									<p className="text-center text-xs leading-relaxed text-muted-foreground lg:text-sm">
										{step.description}
									</p>
								</motion.div>
							</Fragment>
						);
					})}
				</div>
			</div>

			{/* Mobile: Vertical timeline */}
			<div className="relative md:hidden">
				<div
					aria-hidden="true"
					className="absolute top-0 bottom-0 left-6 w-0.5"
					style={{
						background: `linear-gradient(to bottom, ${STEP_COLORS[0]}, ${STEP_COLORS[2]}, ${STEP_COLORS[4]})`,
						opacity: 0.3,
					}}
				/>

				<ol className="relative list-none space-y-5 p-0 pl-14">
					{steps.map((step, i) => {
						const color = STEP_COLORS[i] ?? STEP_COLORS[0]!;
						const Icon = iconMap[step.iconName];

						return (
							<motion.li
								key={step.stepNumber}
								className="relative"
								initial={reduced ? undefined : { opacity: 0, x: -12 }}
								whileInView={{ opacity: 1, x: 0 }}
								transition={{
									duration: 0.4,
									delay: i * 0.08,
								}}
								viewport={{ once: true }}
							>
								<span
									className="absolute -left-[40px] top-4 flex h-5 w-5 items-center justify-center rounded-full"
									style={{
										background: `linear-gradient(135deg, ${color}, ${hexToRgba(color, 0.7)})`,
									}}
								>
									<span className="h-2 w-2 rounded-full bg-white" />
								</span>

								<div
									className="rounded-xl bg-white/5 p-4 backdrop-blur-xl"
									style={{
										border: `1px solid ${hexToRgba(color, 0.25)}`,
									}}
								>
									<div className="mb-2 flex items-center gap-3">
										<div
											className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
											style={{
												backgroundColor: hexToRgba(color, 0.12),
											}}
										>
											{Icon && <Icon className="h-4 w-4" style={{ color }} />}
										</div>
										<h3 className="font-semibold text-foreground">
											{step.title}
										</h3>
									</div>
									<p className="text-sm leading-relaxed text-muted-foreground">
										{step.description}
									</p>
								</div>
							</motion.li>
						);
					})}
				</ol>
			</div>
		</div>
	);
}
