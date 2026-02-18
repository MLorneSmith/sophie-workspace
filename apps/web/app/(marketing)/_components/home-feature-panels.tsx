"use client";

/**
 * HTML-rendered preview panels for the feature showcase section.
 * Styled to match the Framer.com "Design Sidebar" aesthetic:
 * dark editor chrome, realistic UI mockups, layered panels.
 */

/* ------------------------------------------------------------------ */
/*  Panel 1: AI Writing Canvas                                         */
/* ------------------------------------------------------------------ */

export function AIWritingPanel() {
	return (
		<div className="relative h-full w-full overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]">
			{/* Top toolbar */}
			<div className="flex items-center gap-3 border-b border-white/10 px-4 py-2.5">
				<div className="flex gap-1.5">
					<span className="size-2.5 rounded-full bg-[#ff5f57]" />
					<span className="size-2.5 rounded-full bg-[#febc2e]" />
					<span className="size-2.5 rounded-full bg-[#28c840]" />
				</div>
				<div className="flex items-center gap-2 text-xs text-white/40">
					<span className="rounded bg-white/10 px-2 py-0.5 text-[10px]">
						SlideHeroes
					</span>
					<span>/</span>
					<span>Q4 Strategy Deck</span>
				</div>
				<div className="ml-auto flex items-center gap-2">
					<span className="text-[10px] text-white/30">Auto-saved</span>
					<div className="size-5 rounded-full bg-blue-500/20 ring-1 ring-blue-500/40" />
				</div>
			</div>

			<div className="flex h-[calc(100%-37px)]">
				{/* Left sidebar - document outline */}
				<div className="w-[180px] shrink-0 border-r border-white/10 p-3">
					<div className="mb-3 text-[10px] font-medium tracking-wider text-white/40 uppercase">
						Structure
					</div>
					{[
						{ label: "Situation", active: true },
						{ label: "Complication", active: false },
						{ label: "Resolution", active: false },
						{ label: "Key Metrics", active: false },
						{ label: "Next Steps", active: false },
					].map((item) => (
						<div
							key={item.label}
							className={`mb-1 rounded-md px-2.5 py-1.5 text-xs ${
								item.active
									? "bg-white/10 font-medium text-white"
									: "text-white/40"
							}`}
						>
							{item.label}
						</div>
					))}

					<div className="mt-6 mb-2 text-[10px] font-medium tracking-wider text-white/40 uppercase">
						AI Suggestions
					</div>
					<div className="space-y-1.5">
						<div className="rounded-md bg-blue-500/10 px-2.5 py-1.5 text-[11px] text-blue-400">
							+ Add data slide
						</div>
						<div className="rounded-md bg-blue-500/10 px-2.5 py-1.5 text-[11px] text-blue-400">
							+ Strengthen claim
						</div>
					</div>
				</div>

				{/* Center canvas */}
				<div className="flex-1 p-6">
					<div className="mb-4">
						<div className="mb-1 text-[10px] text-white/30">
							SLIDE 1 — SITUATION
						</div>
						<h3 className="mb-3 text-lg font-semibold text-white">
							Market Landscape is Shifting
						</h3>
						<div className="space-y-2 text-sm leading-relaxed text-white/60">
							<p>
								Enterprise presentation tools are converging on AI-first
								workflows, with 73% of Fortune 500 companies now investing in
								automated content creation.
							</p>
							<p>
								Three forces are driving this shift: increased demand for
								data-driven storytelling, pressure for faster turnaround on
								executive communications, and the need for consistent
								brand-quality output at scale.
							</p>
						</div>
					</div>

					{/* AI inline suggestion */}
					<div className="mt-4 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
						<div className="mb-1 flex items-center gap-1.5">
							<div className="size-3.5 rounded bg-blue-500 text-center text-[8px] leading-[14px] font-bold text-white">
								AI
							</div>
							<span className="text-[10px] font-medium text-blue-400">
								Suggestion
							</span>
						</div>
						<p className="text-xs leading-relaxed text-white/50">
							Consider adding a specific metric here — e.g. &quot;McKinsey
							reports that structured frameworks improve executive buy-in by
							42%.&quot;
						</p>
					</div>
				</div>

				{/* Right sidebar - AI chat */}
				<div className="w-[200px] shrink-0 border-l border-white/10 p-3">
					<div className="mb-3 flex items-center gap-1.5">
						<div className="size-4 rounded bg-gradient-to-br from-blue-500 to-purple-500 text-center text-[8px] leading-4 font-bold text-white">
							AI
						</div>
						<span className="text-xs font-medium text-white/60">
							Writing Assistant
						</span>
					</div>

					<div className="space-y-2.5">
						<ChatBubble
							isAI
							text="I've analyzed your Q4 Strategy Deck. The SCQ framework is well-structured."
						/>
						<ChatBubble
							isAI={false}
							text="Can you strengthen the data on slide 3?"
						/>
						<ChatBubble
							isAI
							text="Done — I've added two supporting data points from Gartner and McKinsey research."
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

function ChatBubble({ isAI, text }: { isAI: boolean; text: string }) {
	return (
		<div
			className={`rounded-lg px-2.5 py-2 text-[11px] leading-relaxed ${
				isAI
					? "bg-white/5 text-white/60"
					: "ml-3 bg-blue-500/10 text-blue-300/80"
			}`}
		>
			{text}
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Panel 2: Training Program (CMS-style)                              */
/* ------------------------------------------------------------------ */

const courseModules = [
	{
		title: "Story Structure & Frameworks",
		lessons: 8,
		duration: "2h 15m",
		progress: 100,
		category: "Core",
	},
	{
		title: "Data Visualization Mastery",
		lessons: 6,
		duration: "1h 45m",
		progress: 100,
		category: "Core",
	},
	{
		title: "Executive Communication",
		lessons: 10,
		duration: "3h 20m",
		progress: 65,
		category: "Advanced",
	},
	{
		title: "MECE Problem Decomposition",
		lessons: 5,
		duration: "1h 30m",
		progress: 40,
		category: "Frameworks",
	},
	{
		title: "Persuasion & Influence",
		lessons: 7,
		duration: "2h 00m",
		progress: 0,
		category: "Advanced",
	},
	{
		title: "High-Stakes Meeting Prep",
		lessons: 4,
		duration: "1h 10m",
		progress: 0,
		category: "Practical",
	},
];

const categoryColors: Record<string, string> = {
	Core: "bg-emerald-500/20 text-emerald-400",
	Advanced: "bg-purple-500/20 text-purple-400",
	Frameworks: "bg-blue-500/20 text-blue-400",
	Practical: "bg-amber-500/20 text-amber-400",
};

export function TrainingPanel() {
	return (
		<div className="relative h-full w-full overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]">
			{/* Top toolbar */}
			<div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
				<div className="flex items-center gap-3">
					<div className="flex gap-1.5">
						<span className="size-2.5 rounded-full bg-[#ff5f57]" />
						<span className="size-2.5 rounded-full bg-[#febc2e]" />
						<span className="size-2.5 rounded-full bg-[#28c840]" />
					</div>
					<span className="text-xs text-white/50">Training Dashboard</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-[10px] text-white/30">40 lessons</span>
					<span className="text-[10px] text-white/30">·</span>
					<span className="text-[10px] text-white/30">12h total</span>
				</div>
			</div>

			<div className="flex h-[calc(100%-37px)]">
				{/* Left sidebar */}
				<div className="w-[170px] shrink-0 border-r border-white/10 p-3">
					<div className="mb-3 text-[10px] font-medium tracking-wider text-white/40 uppercase">
						Collections
					</div>
					{[
						{ label: "Modules", count: 6, active: true },
						{ label: "Video Library", count: 40, active: false },
						{ label: "Case Studies", count: 12, active: false },
						{ label: "Templates", count: 24, active: false },
					].map((item) => (
						<div
							key={item.label}
							className={`mb-0.5 flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs ${
								item.active
									? "bg-white/10 font-medium text-white"
									: "text-white/40"
							}`}
						>
							<span>{item.label}</span>
							<span className="text-[10px] text-white/25">{item.count}</span>
						</div>
					))}

					<div className="mt-5 rounded-lg bg-white/5 p-2.5">
						<div className="mb-1 text-[10px] text-white/40">Your progress</div>
						<div className="text-lg font-bold text-white">47%</div>
						<div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
							<div
								className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
								style={{ width: "47%" }}
							/>
						</div>
					</div>
				</div>

				{/* Main content - data table */}
				<div className="flex-1 overflow-hidden">
					{/* Search bar */}
					<div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
						<span className="text-xs text-white/30">⌕</span>
						<span className="text-xs text-white/25">Search 6 modules...</span>
					</div>

					{/* Table header */}
					<div className="grid grid-cols-[1fr_60px_60px_80px_80px] gap-2 border-b border-white/10 px-4 py-2 text-[10px] font-medium tracking-wider text-white/30 uppercase">
						<span>Module</span>
						<span>Lessons</span>
						<span>Duration</span>
						<span>Category</span>
						<span>Progress</span>
					</div>

					{/* Table rows */}
					{courseModules.map((mod) => (
						<div
							key={mod.title}
							className="grid grid-cols-[1fr_60px_60px_80px_80px] items-center gap-2 border-b border-white/5 px-4 py-2.5 transition-colors hover:bg-white/[0.02]"
						>
							<span className="truncate text-xs text-white/70">
								{mod.title}
							</span>
							<span className="text-xs text-white/40">{mod.lessons}</span>
							<span className="text-xs text-white/40">{mod.duration}</span>
							<span
								className={`inline-block w-fit rounded-full px-2 py-0.5 text-[10px] ${categoryColors[mod.category] ?? ""}`}
							>
								{mod.category}
							</span>
							<div className="flex items-center gap-1.5">
								<div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
									<div
										className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
										style={{
											width: `${mod.progress}%`,
										}}
									/>
								</div>
								<span className="w-7 text-right text-[10px] text-white/30">
									{mod.progress}%
								</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

/* ------------------------------------------------------------------ */
/*  Panel 3: Coaching (Collaboration-style)                            */
/* ------------------------------------------------------------------ */

const feedbackItems = [
	{
		author: "Sarah Chen",
		role: "Executive Coach",
		initials: "SC",
		color: "bg-pink-500",
		text: "The opening needs a stronger hook. Lead with the revenue impact — that's what the CFO cares about.",
		time: "2m ago",
		slide: "Slide 1",
	},
	{
		author: "You",
		role: "",
		initials: "MS",
		color: "bg-blue-500",
		text: 'Updated — now opens with "This quarter, we left $4.2M in pipeline due to misaligned messaging."',
		time: "Just now",
		slide: "Slide 1",
	},
	{
		author: "Sarah Chen",
		role: "Executive Coach",
		initials: "SC",
		color: "bg-pink-500",
		text: "Much better. Now the complication section needs to show the gap between current and target state. Use a waterfall chart here.",
		time: "Just now",
		slide: "Slide 3",
	},
];

export function CoachingPanel() {
	return (
		<div className="relative h-full w-full overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]">
			{/* Top toolbar */}
			<div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
				<div className="flex items-center gap-3">
					<div className="flex gap-1.5">
						<span className="size-2.5 rounded-full bg-[#ff5f57]" />
						<span className="size-2.5 rounded-full bg-[#febc2e]" />
						<span className="size-2.5 rounded-full bg-[#28c840]" />
					</div>
					<span className="text-xs text-white/50">Coaching Session</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="flex -space-x-1.5">
						<div className="size-5 rounded-full bg-pink-500 ring-1 ring-black text-center text-[8px] leading-5 font-medium text-white">
							SC
						</div>
						<div className="size-5 rounded-full bg-blue-500 ring-1 ring-black text-center text-[8px] leading-5 font-medium text-white">
							MS
						</div>
					</div>
					<span className="text-[10px] text-white/30">2 collaborators</span>
				</div>
			</div>

			<div className="flex h-[calc(100%-37px)]">
				{/* Left - slide preview */}
				<div className="flex w-[220px] shrink-0 flex-col border-r border-white/10 p-3">
					<div className="mb-2 text-[10px] font-medium tracking-wider text-white/40 uppercase">
						Presentation Review
					</div>

					{/* Mini slide preview */}
					<div className="mb-3 rounded-lg border border-white/10 bg-white/5 p-3">
						<div className="mb-2 text-[10px] text-white/30">
							Slide 1 — Situation
						</div>
						<div className="text-sm font-semibold text-white">
							Q4 Revenue Impact
						</div>
						<p className="mt-1 text-[11px] leading-relaxed text-white/40">
							This quarter, we left $4.2M in pipeline due to misaligned
							messaging across regional teams.
						</p>
					</div>

					{/* Score card */}
					<div className="rounded-lg bg-white/5 p-2.5">
						<div className="mb-2 text-[10px] text-white/40">
							Presentation Score
						</div>
						<div className="flex items-end gap-1">
							<span className="text-2xl font-bold text-emerald-400">8.2</span>
							<span className="mb-0.5 text-xs text-white/30">/ 10</span>
						</div>
						<div className="mt-2 space-y-1.5">
							{[
								{ label: "Structure", score: 9 },
								{ label: "Data Usage", score: 7 },
								{ label: "Narrative", score: 8.5 },
								{ label: "Visual Design", score: 8 },
							].map((metric) => (
								<div
									key={metric.label}
									className="flex items-center justify-between"
								>
									<span className="text-[10px] text-white/40">
										{metric.label}
									</span>
									<span className="text-[10px] font-medium text-white/60">
										{metric.score}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Right - feedback thread */}
				<div className="flex flex-1 flex-col">
					<div className="border-b border-white/10 px-4 py-2">
						<span className="text-xs text-white/40">Feedback Thread</span>
						<span className="ml-2 text-[10px] text-white/20">3 comments</span>
					</div>

					<div className="flex-1 space-y-3 overflow-hidden p-4">
						{feedbackItems.map((item) => (
							<div key={item.initials} className="flex gap-2.5">
								<div
									className={`size-6 shrink-0 rounded-full ${item.color} text-center text-[9px] leading-6 font-medium text-white`}
								>
									{item.initials}
								</div>
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<span className="text-xs font-medium text-white/70">
											{item.author}
										</span>
										{item.role && (
											<span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] text-white/40">
												{item.role}
											</span>
										)}
										<span className="text-[10px] text-white/20">
											{item.time}
										</span>
									</div>
									<div className="mb-0.5 text-[10px] text-blue-400/60">
										{item.slide}
									</div>
									<p className="text-[11px] leading-relaxed text-white/50">
										{item.text}
									</p>
								</div>
							</div>
						))}
					</div>

					{/* Input bar */}
					<div className="border-t border-white/10 px-4 py-2.5">
						<div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
							<span className="text-xs text-white/20">Reply to coach...</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
