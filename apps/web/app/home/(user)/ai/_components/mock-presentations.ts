export type PresentationStep =
	| "profile"
	| "assemble"
	| "outline"
	| "storyboard"
	| "generate";

export type PresentationProject = {
	id: string;
	title: string;
	audienceName: string;
	audienceSummary: string;
	createdAt: string; // ISO
	updatedAt: string; // ISO
	currentStep: PresentationStep;
	// Index of last completed step (inclusive). -1 means none.
	completedThroughIndex: number;
};

export const WORKFLOW_STEPS: Array<{
	key: PresentationStep;
	label: string;
}> = [
	{ key: "profile", label: "Profile" },
	{ key: "assemble", label: "Assemble" },
	{ key: "outline", label: "Outline" },
	{ key: "storyboard", label: "Storyboard" },
	{ key: "generate", label: "Generate" },
];

export const STEP_ACCENT_SPECTRUM = [
	"#2431E0", // Deep Blue
	"#246CE0", // Medium Blue
	"#24A9E0", // Brand Cyan
	"#24E0DD", // Cyan-Teal
	"#24E09D", // Teal-Green
] as const;

export const MOCK_PRESENTATIONS: PresentationProject[] = [
	{
		id: "pres-84c2",
		title: "TD Bank — Branch Network Optimization (Q2 2026)",
		audienceName: "Sarah Chen, VP Retail Strategy",
		audienceSummary:
			"Primary audience: VP-level retail strategy leader. Priorities: cost-to-serve, customer experience, and defensible ROI. Tone: crisp, consultative, numbers-forward.",
		createdAt: "2026-02-05T15:22:00.000Z",
		updatedAt: "2026-02-16T20:11:00.000Z",
		currentStep: "outline",
		completedThroughIndex: 1,
	},
	{
		id: "pres-2f19",
		title: "Series B Pitch — AI Ops for Mid-Market SaaS",
		audienceName: "Growth Equity Partner, SF",
		audienceSummary:
			"Primary audience: growth equity partner. Decision lens: market size, distribution, retention, and defensible differentiation. Tone: confident, high-signal, low-fluff.",
		createdAt: "2026-01-28T09:05:00.000Z",
		updatedAt: "2026-02-10T12:40:00.000Z",
		currentStep: "storyboard",
		completedThroughIndex: 2,
	},
	{
		id: "pres-5a8d",
		title: "Board Update — 90-Day Turnaround Plan",
		audienceName: "Operating Partner + Board Members",
		audienceSummary:
			"Primary audience: board-level operators. Priorities: pace, accountability, and risk control. Tone: direct, action-oriented, with clear owners and timelines.",
		createdAt: "2026-02-12T18:12:00.000Z",
		updatedAt: "2026-02-18T09:33:00.000Z",
		currentStep: "profile",
		completedThroughIndex: -1,
	},
	{
		id: "pres-9b31",
		title: "Sales Enablement — CIO Security Modernization Narrative",
		audienceName: "CIO + CISO Stakeholders",
		audienceSummary:
			"Primary audience: CIO/CISO stakeholders. Decision lens: risk, implementation complexity, and vendor credibility. Tone: technical but executive-readable.",
		createdAt: "2026-01-19T22:01:00.000Z",
		updatedAt: "2026-02-14T07:08:00.000Z",
		currentStep: "generate",
		completedThroughIndex: 3,
	},
];
