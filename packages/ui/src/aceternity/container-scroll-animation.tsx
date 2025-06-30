"use client";

import type { MotionValue } from "framer-motion";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import React from "react";

import { cn } from "../lib/utils";

interface ContainerScrollProps {
	children: React.ReactNode;
}

interface CardProps {
	rotate: MotionValue<number>;
	scale: MotionValue<number>;
	translate: MotionValue<number>;
	children: React.ReactNode;
}

export const ContainerScroll = ({ children }: ContainerScrollProps) => {
	const [isMobile, setIsMobile] = React.useState(false);
	const { scrollYProgress } = useScroll();

	React.useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => {
			window.removeEventListener("resize", checkMobile);
		};
	}, []);

	const scaleDimensions = () => {
		return isMobile ? [0.7, 0.9] : [1.05, 1];
	};

	const springConfig = {
		stiffness: 150,
		damping: 20,
		mass: 1,
		restDelta: 0.001,
	};

	const rotate = useSpring(
		useTransform(scrollYProgress, [0, 0.5, 1], [15, 5, 0]),
		springConfig,
	);
	const scale = useSpring(
		useTransform(scrollYProgress, [0, 0.5, 1], [...scaleDimensions(), 1]),
		springConfig,
	);
	const translate = useSpring(
		useTransform(scrollYProgress, [0, 0.5, 1], [0, -50, -100]),
		springConfig,
	);

	return (
		<div
			className="relative h-[100vh]"
			style={{
				perspective: "1000px",
				transformStyle: "preserve-3d",
			}}
		>
			<div
				className="sticky top-0 flex h-screen items-center justify-center"
				style={{
					transformStyle: "preserve-3d",
					zIndex: 1,
				}}
			>
				<div
					className="mx-auto w-full max-w-6xl px-4"
					style={{
						transformStyle: "preserve-3d",
						zIndex: 1,
					}}
				>
					<Card rotate={rotate} translate={translate} scale={scale}>
						{children}
					</Card>
				</div>
			</div>
		</div>
	);
};

export const Card = ({ rotate, scale, translate, children }: CardProps) => (
	<div
		className="relative"
		style={{
			transformStyle: "preserve-3d",
			zIndex: 1,
		}}
	>
		<motion.div
			style={{
				rotateX: rotate,
				scale,
				translateY: translate,
				transformStyle: "preserve-3d",
				zIndex: 1,
			}}
		>
			<div
				className={cn(
					"mx-auto -mt-12 max-w-5xl",
					"h-[30rem] w-full md:h-[40rem]",
					"border-4 border-border",
					"p-2 md:p-6",
					"rounded-[30px] bg-card dark:bg-card",
					"relative",
				)}
				style={{
					boxShadow:
						"rgba(0, 0, 0, 0.6) 0px 30px 60px -12px, rgba(0, 0, 0, 0.4) 0px 18px 36px -18px",
					transform: "translateZ(0)",
					transformStyle: "preserve-3d",
					zIndex: 1,
				}}
			>
				<div
					className={cn(
						"h-full w-full",
						"overflow-hidden rounded-2xl",
						"bg-background dark:bg-background",
						"md:rounded-2xl md:p-4",
					)}
					style={{
						transformStyle: "preserve-3d",
						zIndex: 1,
					}}
				>
					{children}
				</div>
			</div>
		</motion.div>
	</div>
);
