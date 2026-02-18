"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { type CausticsGL, initCausticsGL } from "../_lib/caustics-shader";

interface CausticsBackgroundProps {
	className?: string;
	fallback?: React.ReactNode;
}

export function CausticsBackground({
	className,
	fallback,
}: CausticsBackgroundProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const glRef = useRef<CausticsGL | null>(null);
	const rafRef = useRef<number>(0);
	const containerRef = useRef<HTMLDivElement>(null);
	const [webglSupported, setWebglSupported] = useState(true);
	const [ready, setReady] = useState(false);

	const getDpr = useCallback(() => {
		if (typeof window === "undefined") return 1;
		const isMobile = window.innerWidth <= 768;
		return isMobile ? 1 : Math.min(window.devicePixelRatio, 2);
	}, []);

	useEffect(() => {
		const canvas = canvasRef.current;
		const container = containerRef.current;
		if (!canvas || !container) return;

		// Reduced motion: render one frame then stop
		const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		let isReducedMotion = motionQuery.matches;

		// Init WebGL
		let gl: CausticsGL | null = null;
		try {
			gl = initCausticsGL(canvas);
		} catch {
			// shader compilation or linking failed
		}

		if (!gl) {
			setWebglSupported(false);
			return;
		}
		glRef.current = gl;

		// Size canvas to container
		function handleResize() {
			if (!gl || !container) return;
			const { width, height } = container.getBoundingClientRect();
			gl.resize(width, height, getDpr());
			// Render at least once after resize
			gl.render(performance.now() / 1000);
		}

		handleResize();

		// Mark ready after first frame is on screen
		setReady(true);

		// Animation loop
		let running = true;

		function loop(timestamp: number) {
			if (!running || !gl) return;
			gl.render(timestamp / 1000);
			if (!isReducedMotion) {
				rafRef.current = requestAnimationFrame(loop);
			}
		}

		if (isReducedMotion) {
			gl.render(0); // single static frame
		} else {
			rafRef.current = requestAnimationFrame(loop);
		}

		// Visibility pause
		function handleVisibility() {
			if (document.hidden) {
				running = false;
				cancelAnimationFrame(rafRef.current);
			} else if (!isReducedMotion) {
				running = true;
				rafRef.current = requestAnimationFrame(loop);
			}
		}
		document.addEventListener("visibilitychange", handleVisibility);

		// Reduced motion change
		function handleMotionChange(e: MediaQueryListEvent) {
			isReducedMotion = e.matches;
			if (isReducedMotion) {
				running = false;
				cancelAnimationFrame(rafRef.current);
				gl?.render(0);
			} else if (!document.hidden) {
				running = true;
				rafRef.current = requestAnimationFrame(loop);
			}
		}
		motionQuery.addEventListener("change", handleMotionChange);

		// Resize
		let resizeTimer: ReturnType<typeof setTimeout>;
		function handleResizeDebounced() {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(handleResize, 250);
		}
		window.addEventListener("resize", handleResizeDebounced);

		// Context loss / restore
		function handleContextLost(e: Event) {
			e.preventDefault();
			running = false;
			cancelAnimationFrame(rafRef.current);
		}

		function handleContextRestored() {
			try {
				gl = initCausticsGL(canvas!);
				if (!gl) {
					setWebglSupported(false);
					return;
				}
				glRef.current = gl;
				handleResize();
				if (!isReducedMotion && !document.hidden) {
					running = true;
					rafRef.current = requestAnimationFrame(loop);
				}
			} catch {
				setWebglSupported(false);
			}
		}

		canvas.addEventListener("webglcontextlost", handleContextLost);
		canvas.addEventListener("webglcontextrestored", handleContextRestored);

		return () => {
			running = false;
			cancelAnimationFrame(rafRef.current);
			clearTimeout(resizeTimer);
			document.removeEventListener("visibilitychange", handleVisibility);
			motionQuery.removeEventListener("change", handleMotionChange);
			window.removeEventListener("resize", handleResizeDebounced);
			canvas.removeEventListener("webglcontextlost", handleContextLost);
			canvas.removeEventListener("webglcontextrestored", handleContextRestored);
			gl?.destroy();
			glRef.current = null;
		};
	}, [getDpr]);

	return (
		<div
			ref={containerRef}
			aria-hidden="true"
			className={`pointer-events-none absolute inset-0 z-[1] overflow-hidden ${className ?? ""}`}
		>
			{webglSupported ? (
				<canvas
					ref={canvasRef}
					className="h-full w-full"
					style={{ backgroundColor: "#000" }}
				/>
			) : (
				(fallback ?? <CSSFallbackGradient />)
			)}

			{/* Overlays hidden until first frame renders to prevent flash */}
			{ready && (
				<>
					{/* Grid mask overlay — ultra-fine, nearly invisible texture */}
					<div
						className="absolute inset-0 z-[2]"
						style={{
							backgroundImage: [
								"linear-gradient(0deg, rgba(0,0,0,0.08) 1px, transparent 1px)",
								"linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px)",
							].join(", "),
							backgroundSize: "8px 8px",
						}}
					/>

					{/* CRT scanline texture overlay */}
					<div
						className="absolute inset-0 z-[3] opacity-[0.04]"
						style={{
							backgroundImage:
								"repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
							backgroundSize: "100% 4px",
						}}
					/>

					{/* Edge vignette */}
					<div
						className="absolute inset-0 z-[4]"
						style={{
							boxShadow:
								"inset 0 60px 80px 40px rgba(0,0,0,0.6), inset 0 -60px 80px 40px rgba(0,0,0,0.6)",
						}}
					/>
				</>
			)}
		</div>
	);
}

/** Simple CSS gradient shown when WebGL is unavailable */
function CSSFallbackGradient() {
	return (
		<div
			className="absolute inset-0"
			style={{
				background:
					"linear-gradient(125deg, #000 0%, #0a1530 30%, #0d1a3a 50%, #0a1530 70%, #000 100%)",
			}}
		/>
	);
}
