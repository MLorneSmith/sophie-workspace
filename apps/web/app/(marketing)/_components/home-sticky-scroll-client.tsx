"use client";

import { useEffect, useRef, useState } from "react";
import {
	AnimatePresence,
	motion,
	useReducedMotion,
	useScroll,
	useTransform,
} from "motion/react";

import { DeviceFrame } from "./device-frame";
import OptimizedImage from "./home-optimized-image";

interface StickyContentItem {
	title: string;
	description: string[];
	imageSrc: string;
	overline: string;
	deviceFrame?: boolean;
}

interface HomeStickyScrollProps {
	content: StickyContentItem[];
}

function useIsMobile(breakpoint = 1024) {
	const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

	useEffect(() => {
		const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
		const onChange = () => {
			setIsMobile(window.innerWidth < breakpoint);
		};
		mql.addEventListener("change", onChange);
		setIsMobile(window.innerWidth < breakpoint);
		return () => mql.removeEventListener("change", onChange);
	}, [breakpoint]);

	return isMobile;
}

export default function HomeStickyScroll({ content }: HomeStickyScrollProps) {
	const isMobile = useIsMobile();

	// Show nothing during SSR to avoid hydration mismatch
	if (isMobile === undefined) {
		return <MobileStackedView content={content} />;
	}

	if (isMobile) {
		return <MobileStackedView content={content} />;
	}

	return <DesktopStickyScroll content={content} />;
}

function MobileStackedView({ content }: { content: StickyContentItem[] }) {
	return (
		<div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
			{content.map((item) => (
				<article
					key={item.title}
					className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm"
				>
					<div className="aspect-video w-full">
						{item.deviceFrame ? (
							<DeviceFrame>
								<OptimizedImage
									src={item.imageSrc}
									alt={item.title}
									width={1200}
									height={800}
									className="h-full w-full object-cover"
									sizes="100vw"
									quality={85}
								/>
							</DeviceFrame>
						) : (
							<OptimizedImage
								src={item.imageSrc}
								alt={item.title}
								width={1200}
								height={800}
								className="h-full w-full object-cover"
								sizes="100vw"
								quality={85}
							/>
						)}
					</div>
					<div className="p-5">
						<span className="mb-2 block font-mono text-sm text-muted-foreground">
							{item.overline}
						</span>
						<h3 className="mb-3 text-xl font-bold text-foreground">
							{item.title}
						</h3>
						<div className="space-y-2">
							{item.description.map((desc) => (
								<p
									key={desc}
									className="text-sm leading-relaxed text-muted-foreground"
								>
									{desc}
								</p>
							))}
						</div>
					</div>
				</article>
			))}
		</div>
	);
}

function DesktopStickyScroll({ content }: { content: StickyContentItem[] }) {
	const shouldReduceMotion = useReducedMotion();
	const containerRef = useRef<HTMLDivElement>(null);
	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ["start start", "end end"],
	});

	const activeStepIndex = useTransform(
		scrollYProgress,
		[0, 0.33, 0.66, 1],
		[0, 1, 2, 2],
	);

	const progressBarHeight = useTransform(
		scrollYProgress,
		[0, 1],
		["0%", "100%"],
	);

	return (
		<div ref={containerRef} className="relative h-[300vh]">
			<section
				className="sticky top-0 flex h-screen items-center"
				aria-label="Feature showcase"
			>
				<div className="mx-auto grid w-full max-w-7xl grid-cols-5 gap-8 px-4 sm:px-6 lg:px-8">
					{/* Progress bar - left edge */}
					<div className="absolute left-4 top-1/2 -translate-y-1/2 sm:left-6 lg:left-8" aria-hidden="true">
						<div className="relative h-48 w-1 overflow-hidden rounded-full bg-white/10">
							<motion.div
								className="absolute top-0 left-0 w-full rounded-full bg-gradient-to-b from-blue-500 to-purple-500"
								style={{ height: progressBarHeight }}
							/>
						</div>
					</div>

					{/* Left column - Text content (2/5) */}
					<div className="col-span-2 flex items-center">
						<div className="relative w-full">
							{content.map((item, index) => (
								<TextSection
									key={item.title}
									item={item}
									index={index}
									activeStepIndex={activeStepIndex}
									reducedMotion={!!shouldReduceMotion}
								/>
							))}
						</div>
					</div>

					{/* Right column - Images (3/5) */}
					<div className="col-span-3 flex items-center justify-center">
						<div className="relative aspect-video w-full">
							<AnimatePresence mode="wait">
								<ImagePanel
									content={content}
									activeStepIndex={activeStepIndex}
									reducedMotion={!!shouldReduceMotion}
								/>
							</AnimatePresence>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}

function TextSection({
	item,
	index,
	activeStepIndex,
	reducedMotion,
}: {
	item: StickyContentItem;
	index: number;
	activeStepIndex: ReturnType<typeof useTransform<number, number>>;
	reducedMotion: boolean;
}) {
	const opacity = useTransform(activeStepIndex, (latest) => {
		const rounded = Math.round(latest);
		return rounded === index ? 1 : 0.3;
	});

	const isActiveValue = useTransform(activeStepIndex, (latest): number =>
		Math.round(latest) === index ? 1 : 0,
	);
	const isActive = useMotionValueState(isActiveValue);

	return (
		<motion.div
			className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
			style={reducedMotion ? { opacity: isActive ? 1 : 0.3 } : { opacity }}
			aria-live={isActive ? "polite" : "off"}
		>
			<span className="mb-2 block font-mono text-sm text-muted-foreground">
				{item.overline}
			</span>
			<h3 className="mb-3 text-xl font-bold text-foreground lg:text-2xl">
				{item.title}
			</h3>
			<div className="space-y-2">
				{item.description.map((desc) => (
					<p
						key={desc}
						className="text-sm leading-relaxed text-muted-foreground"
					>
						{desc}
					</p>
				))}
			</div>
		</motion.div>
	);
}

function ImagePanel({
	content,
	activeStepIndex,
	reducedMotion,
}: {
	content: StickyContentItem[];
	activeStepIndex: ReturnType<typeof useTransform<number, number>>;
	reducedMotion: boolean;
}) {
	const currentIndex = useTransform(activeStepIndex, (latest) =>
		Math.round(latest),
	);
	const index = useMotionValueState(currentIndex);
	const item = content[index] ?? content[0];

	if (!item) return null;

	const image = (
		<OptimizedImage
			src={item.imageSrc}
			alt={item.title}
			width={1200}
			height={800}
			className="h-full w-full rounded-lg object-cover"
			priority={index === 0}
			loading={index === 0 ? "eager" : "lazy"}
			sizes="60vw"
			quality={85}
		/>
	);

	return (
		<motion.div
			key={index}
			initial={reducedMotion ? false : { opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
			transition={
				reducedMotion ? { duration: 0 } : { duration: 0.4, ease: "easeInOut" }
			}
			className="absolute inset-0"
		>
			{item.deviceFrame ? (
				<DeviceFrame>{image}</DeviceFrame>
			) : (
				<div className="overflow-hidden rounded-xl">{image}</div>
			)}
		</motion.div>
	);
}

function useMotionValueState(
	motionValue: ReturnType<typeof useTransform<number, number>>,
) {
	const [value, setValue] = useState(0);
	useEffect(() => {
		setValue(motionValue.get());
		const unsubscribe = motionValue.on("change", (latest) => {
			setValue(latest);
		});
		return unsubscribe;
	}, [motionValue]);
	return value;
}
