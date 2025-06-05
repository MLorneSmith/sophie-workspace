"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@kit/ui/button";

import { cn } from "../lib/utils";

interface PixelData {
	x: number;
	y: number;
	r: number;
	color: string;
}

interface RawPixelData {
	x: number;
	y: number;
	color: [number, number, number, number];
}

interface PlaceholdersAndVanishInputProps {
	placeholders: string[];
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

// Spring configuration for smoother animations
const springConfig = {
	type: "spring",
	stiffness: 150,
	damping: 15,
	mass: 0.1,
	restDelta: 0.001,
};

export function PlaceholdersAndVanishInput({
	placeholders,
	onChange,
	onSubmit,
}: PlaceholdersAndVanishInputProps) {
	const [currentPlaceholder, setCurrentPlaceholder] = useState(0);

	const intervalRef = useRef<NodeJS.Timeout | null>(null);
	const startAnimation = useCallback(() => {
		// Clear any existing interval
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
		}

		// Set initial state
		setCurrentPlaceholder(0);

		// Start new interval with consistent timing
		intervalRef.current = setInterval(() => {
			setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
		}, 2500); // Fixed 2.5 second interval
	}, [placeholders.length]);

	const handleVisibilityChange = useCallback(() => {
		if (document.visibilityState !== "visible") {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		} else {
			startAnimation();
		}
	}, [startAnimation]);

	useEffect(() => {
		startAnimation();
		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [placeholders, handleVisibilityChange, startAnimation]);

	const canvasRef = useRef<HTMLCanvasElement>(null);
	const newDataRef = useRef<PixelData[]>([]);
	const inputRef = useRef<HTMLInputElement>(null);
	const [value, setValue] = useState("");
	const [animating, setAnimating] = useState(false);

	const draw = useCallback(() => {
		if (!inputRef.current) return;
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		canvas.width = 800;
		canvas.height = 800;
		ctx.clearRect(0, 0, 800, 800);
		const computedStyles = getComputedStyle(inputRef.current);

		const fontSize = Number.parseFloat(
			computedStyles.getPropertyValue("font-size"),
		);
		ctx.font = `${fontSize * 2}px ${computedStyles.fontFamily}`;
		ctx.fillStyle = "#FFF";
		ctx.fillText(value, 16, 40);

		const imageData = ctx.getImageData(0, 0, 800, 800);
		const pixelData = imageData.data;
		const newData: RawPixelData[] = [];

		for (let t = 0; t < 800; t++) {
			const i = 4 * t * 800;
			for (let n = 0; n < 800; n++) {
				const e = i + 4 * n;
				if (
					pixelData[e] !== 0 &&
					pixelData[e + 1] !== 0 &&
					pixelData[e + 2] !== 0
				) {
					const color: [number, number, number, number] = [
						pixelData[e] ?? 0,
						pixelData[e + 1] ?? 0,
						pixelData[e + 2] ?? 0,
						pixelData[e + 3] ?? 0,
					];
					newData.push({
						x: n,
						y: t,
						color,
					});
				}
			}
		}

		newDataRef.current = newData.map(({ x, y, color }) => ({
			x,
			y,
			r: 1,
			color: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`,
		}));
	}, [value]);

	useEffect(() => {
		draw();
	}, [value, draw]);

	const animate = (start: number) => {
		const animateFrame = (pos = 0) => {
			requestAnimationFrame(() => {
				const newArr: PixelData[] = [];
				for (let i = 0; i < newDataRef.current.length; i++) {
					const current = newDataRef.current[i];
					if (!current) continue;

					if (current.x < pos) {
						newArr.push({ ...current });
					} else {
						if (current.r <= 0) {
							current.r = 0;
							continue;
						}
						const updatedPixel: PixelData = {
							x: current.x + (Math.random() > 0.5 ? 1 : -1),
							y: current.y + (Math.random() > 0.5 ? 1 : -1),
							r: current.r - 0.05 * Math.random(),
							color: current.color,
						};
						newArr.push(updatedPixel);
					}
				}
				newDataRef.current = newArr;
				const ctx = canvasRef.current?.getContext("2d");
				if (ctx) {
					ctx.clearRect(pos, 0, 800, 800);
					for (const t of newDataRef.current) {
						const { x: n, y: i, r: s, color } = t;
						if (n > pos) {
							ctx.beginPath();
							ctx.rect(n, i, s, s);
							ctx.fillStyle = color;
							ctx.strokeStyle = color;
							ctx.stroke();
						}
					}
				}
				if (newDataRef.current.length > 0) {
					animateFrame(pos - 8);
				} else {
					setValue("");
					setAnimating(false);
				}
			});
		};
		animateFrame(start);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && !animating) {
			vanishAndSubmit();
		}
	};

	const vanishAndSubmit = () => {
		setAnimating(true);
		draw();

		const value = inputRef.current?.value || "";
		if (value && inputRef.current) {
			const maxX = newDataRef.current.reduce(
				(prev, current) => (current.x > prev ? current.x : prev),
				0,
			);
			animate(maxX);
		}
	};

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		vanishAndSubmit();
		onSubmit?.(e);
	};

	return (
		<div className="mx-auto flex w-full max-w-[1000px] items-center gap-4">
			<label className="w-28 text-base leading-tight font-medium text-gray-600 dark:text-gray-300">
				Name your presentation
			</label>
			<form
				className={cn(
					"relative h-12 min-w-[600px] flex-1 overflow-hidden rounded-md border border-gray-200 bg-white shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),_0px_1px_0px_0px_rgba(25,28,33,0.02),_0px_0px_0px_1px_rgba(25,28,33,0.08)] transition duration-200 focus-within:border-[#24a9e0] dark:border-gray-700 dark:bg-zinc-800/50 dark:focus-within:border-[#24a9e0]",
					value && "bg-gray-50",
				)}
				onSubmit={handleSubmit}
			>
				<canvas
					className={cn(
						"pointer-events-none absolute top-[20%] left-2 origin-top-left scale-50 transform pr-20 text-base invert filter sm:left-4 dark:invert-0",
						!animating ? "opacity-0" : "opacity-100",
					)}
					ref={canvasRef}
				/>
				<input
					onChange={(e) => {
						if (!animating) {
							setValue(e.target.value);
							onChange?.(e);
						}
					}}
					onKeyDown={handleKeyDown}
					ref={inputRef}
					value={value}
					type="text"
					className={cn(
						"relative z-50 h-full w-full rounded-md border-none bg-transparent pr-20 pl-4 text-base text-black focus:ring-0 focus:outline-none dark:text-white",
						animating && "text-transparent dark:text-transparent",
					)}
				/>

				<Button
					disabled={!value}
					type="submit"
					variant="default"
					size="icon"
					className="group absolute top-1/2 right-2 z-50 h-8 w-8 -translate-y-1/2 !bg-[#24a9e0] hover:!bg-[#24a9e0]/90 dark:!bg-[#24a9e0] dark:hover:!bg-[#24a9e0]/90"
				>
					<ArrowRightIcon className="h-4 w-4 text-white transition-transform duration-500 group-hover:translate-x-1" />
				</Button>

				<div className="pointer-events-none absolute inset-0 flex items-center rounded-md">
					<AnimatePresence mode="wait">
						{!value && (
							<div className="w-[calc(100%-2rem)] truncate pl-4 text-left text-base font-normal text-neutral-500 dark:text-zinc-400">
								<motion.span
									initial={{ y: 5, opacity: 0 }}
									animate={{ y: 0, opacity: 1 }}
									exit={{ y: -15, opacity: 0 }}
									transition={springConfig}
									key={placeholders[currentPlaceholder]}
								>
									{placeholders[currentPlaceholder]}
								</motion.span>
							</div>
						)}
					</AnimatePresence>
				</div>
			</form>
		</div>
	);
}
