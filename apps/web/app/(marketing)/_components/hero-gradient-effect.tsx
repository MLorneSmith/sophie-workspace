/**
 * Static CSS gradient fallback for browsers without WebGL2.
 * Only renders when CausticsBackground detects no WebGL support.
 */
export function HeroGradientEffect() {
	return (
		<div
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
		>
			{/* Static diagonal gradient matching caustics color palette */}
			<div
				className="absolute inset-0"
				style={{
					background: [
						"linear-gradient(125deg, #000 0%, #0a1530 25%, #0d1a3a 45%, #0a1530 65%, #000 100%)",
						"radial-gradient(ellipse 60% 50% at 65% 55%, rgba(25,40,90,0.4) 0%, transparent 70%)",
						"radial-gradient(ellipse 40% 35% at 35% 70%, rgba(180,130,40,0.08) 0%, transparent 60%)",
					].join(", "),
				}}
			/>

			{/* CRT scanline texture overlay */}
			<div
				className="absolute inset-0 z-[2] opacity-[0.04]"
				style={{
					backgroundImage:
						"repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
					backgroundSize: "100% 4px",
				}}
			/>

			{/* Edge vignette */}
			<div
				className="absolute inset-0 z-[3]"
				style={{
					boxShadow:
						"inset 0 60px 80px 40px rgba(0,0,0,0.6), inset 0 -60px 80px 40px rgba(0,0,0,0.6)",
				}}
			/>
		</div>
	);
}
