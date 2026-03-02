"use client";

import { ChevronRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
	type ReactNode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

import {
	AIWritingPanel,
	CoachingPanel,
	TrainingPanel,
} from "./home-feature-panels";
import OptimizedImage from "./home-optimized-image";

const AUTO_ADVANCE_MS = 6000;

/** Panel components keyed by content index */
const PANELS: ReactNode[] = [
	<AIWritingPanel key="ai" />,
	<TrainingPanel key="training" />,
	<CoachingPanel key="coaching" />,
];

interface StickyContentItem {
	title: string;
	description: string[];
	imageSrc: string;
	overline: string;
	deviceFrame?: boolean;
	learnMoreHref?: string;
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

	if (isMobile === undefined) {
		return <MobileStackedView content={content} />;
	}

	if (isMobile) {
		return <MobileStackedView content={content} />;
	}

	return <DesktopFeatureTabs content={content} />;
}

/* ------------------------------------------------------------------ */
/*  Desktop: click + auto-advance tabs (Framer-style)                 */
/* ------------------------------------------------------------------ */

function DesktopFeatureTabs({ content }: { content: StickyContentItem[] }) {
	const shouldReduceMotion = useReducedMotion();
	const [activeIndex, setActiveIndex] = useState(0);
	const [timerKey, setTimerKey] = useState(0);
	const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

	const startTimer = useCallback(() => {
		clearInterval(intervalRef.current);
		intervalRef.current = setInterval(() => {
			setActiveIndex((prev) => (prev + 1) % content.length);
			setTimerKey((k) => k + 1);
		}, AUTO_ADVANCE_MS);
	}, [content.length]);

	useEffect(() => {
		if (shouldReduceMotion) return;
		startTimer();
		return () => clearInterval(intervalRef.current);
	}, [startTimer, shouldReduceMotion]);

	const handleTabClick = (index: number) => {
		setActiveIndex(index);
		setTimerKey((k) => k + 1);
		if (!shouldReduceMotion) startTimer();
	};

	return (
		<div
			className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
			aria-label="Feature showcase"
		>
			<div className="grid grid-cols-12 items-center gap-8 lg:gap-12">
				{/* Left sidebar — flat tab list with dividers */}
				<div className="col-span-4 flex flex-col" role="tablist">
					{content.map((item, index) => (
						<TabItem
							key={item.title}
							item={item}
							isActive={index === activeIndex}
							isLast={index === content.length - 1}
							onClick={() => handleTabClick(index)}
							timerKey={timerKey}
							showProgress={!shouldReduceMotion && index === activeIndex}
							reducedMotion={!!shouldReduceMotion}
						/>
					))}
				</div>

				{/* Right — HTML panel with crossfade */}
				<div className="col-span-8" role="tabpanel">
					<div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
						<AnimatePresence mode="wait">
							<motion.div
								key={activeIndex}
								initial={
									shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }
								}
								animate={{ opacity: 1, scale: 1 }}
								exit={
									shouldReduceMotion
										? { opacity: 1 }
										: { opacity: 0, scale: 0.98 }
								}
								transition={
									shouldReduceMotion
										? { duration: 0 }
										: { duration: 0.4, ease: "easeInOut" }
								}
								className="absolute inset-0"
							>
								{PANELS[activeIndex]}
							</motion.div>
						</AnimatePresence>
					</div>
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Tab item — accordion expand for active, dimmed when inactive      */
/* ------------------------------------------------------------------ */

function TabItem({
	item,
	isActive,
	isLast,
	onClick,
	timerKey,
	showProgress,
	reducedMotion,
}: {
	item: StickyContentItem;
	isActive: boolean;
	isLast: boolean;
	onClick: () => void;
	timerKey: number;
	showProgress: boolean;
	reducedMotion: boolean;
}) {
	return (
		<button
			type="button"
			role="tab"
			aria-selected={isActive}
			onClick={onClick}
			className={`relative w-full cursor-pointer text-left transition-all duration-300 ${
				!isLast ? "border-b border-white/10" : ""
			}`}
		>
			<div className="py-5">
				<h3
					className={`text-xl font-semibold transition-colors duration-300 lg:text-2xl ${
						isActive
							? "text-foreground"
							: "text-muted-foreground/50 hover:text-muted-foreground"
					}`}
				>
					{item.title}
				</h3>

				{/* Accordion — description only visible when active */}
				<AnimatePresence initial={false}>
					{isActive && (
						<motion.div
							initial={reducedMotion ? false : { height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
							transition={
								reducedMotion
									? { duration: 0 }
									: { duration: 0.3, ease: "easeInOut" }
							}
							className="overflow-hidden"
						>
							<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
								{item.description.join(". ")}
							</p>
							{item.learnMoreHref && (
								<a
									href={item.learnMoreHref}
									className="mt-3 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
									onClick={(e) => e.stopPropagation()}
								>
									Learn more
									<ChevronRight className="h-3.5 w-3.5" />
								</a>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Progress line — fills the bottom border during auto-advance */}
			{showProgress && (
				<motion.div
					key={timerKey}
					className="absolute bottom-0 left-0 h-px bg-[#24a9e0]"
					initial={{ width: "0%" }}
					animate={{ width: "100%" }}
					transition={{
						duration: AUTO_ADVANCE_MS / 1000,
						ease: "linear",
					}}
				/>
			)}
		</button>
	);
}

/* ------------------------------------------------------------------ */
/*  Mobile: stacked cards                                              */
/* ------------------------------------------------------------------ */

function MobileStackedView({ content }: { content: StickyContentItem[] }) {
	return (
		<div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6">
			{content.map((item, index) => (
				<article
					key={item.title}
					className="overflow-hidden rounded-xl border border-white/10"
				>
					{/* Use HTML panels on mobile too */}
					<div className="aspect-video w-full">
						{PANELS[index] ?? (
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
						<h3 className="mb-3 text-xl font-semibold text-foreground">
							{item.title}
						</h3>
						<p className="text-sm leading-relaxed text-muted-foreground">
							{item.description.join(". ")}
						</p>
					</div>
				</article>
			))}
		</div>
	);
}
