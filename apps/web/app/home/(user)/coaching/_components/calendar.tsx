"use client";

export default function Calendar() {
	return (
		<iframe
			title="SlideHeroes Coaching Calendar - Schedule a 60-minute session"
			src="https://cal.com/slideheroes.com/60min?embed=true&layout=month_view"
			style={{
				width: "100%",
				height: "100%",
				minHeight: "600px",
				border: "none",
				borderRadius: "4px",
			}}
			loading="lazy"
			allowFullScreen
		/>
	);
}
