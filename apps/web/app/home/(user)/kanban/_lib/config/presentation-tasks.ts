/**
 * Presentation Development Workflow Tasks
 *
 * A comprehensive 69-task workflow organized into 9 phases for creating
 * professional presentations. Derived from SlideHeroes course lessons
 * and professional best practices.
 *
 * Source: .ai/specs/presentation-development-steps-enhanced.json
 */

import type { CreateTaskInput } from "../schema/task.schema";

/**
 * Phase metadata for organizing tasks into logical groups.
 * Used for visual separators and progress tracking.
 */
export interface PresentationPhase {
	id: string;
	name: string;
	description: string;
	order: number;
	taskCount: number;
}

export const PRESENTATION_PHASES: PresentationPhase[] = [
	{
		id: "phase-1-discovery",
		name: "Discovery & Research",
		description: "Understand your topic, audience, and context before planning",
		order: 1,
		taskCount: 4,
	},
	{
		id: "phase-2-the-start",
		name: "The Start",
		description: "Define your audience and presentation goals",
		order: 2,
		taskCount: 10,
	},
	{
		id: "phase-3-structure",
		name: "Structure",
		description: "Generate and organize your ideas into a logical flow",
		order: 3,
		taskCount: 10,
	},
	{
		id: "phase-4-storytelling",
		name: "Storytelling",
		description: "Craft your narrative arc and create the storyboard",
		order: 4,
		taskCount: 8,
	},
	{
		id: "phase-5-design",
		name: "Design",
		description: "Apply visual design principles and create slides",
		order: 5,
		taskCount: 9,
	},
	{
		id: "phase-6-data-visualization",
		name: "Data Visualization",
		description: "Create effective charts, graphs, and data displays",
		order: 6,
		taskCount: 6,
	},
	{
		id: "phase-7-review",
		name: "Review & Refinement",
		description: "Quality assurance and feedback incorporation",
		order: 7,
		taskCount: 6,
	},
	{
		id: "phase-8-performance",
		name: "Performance",
		description: "Prepare, practice, and deliver your presentation",
		order: 8,
		taskCount: 11,
	},
	{
		id: "phase-9-follow-up",
		name: "Follow-Up",
		description: "Post-presentation activities and continuous improvement",
		order: 9,
		taskCount: 5,
	},
];

/**
 * Presentation development tasks organized by phase.
 * All 69 tasks derived from the enhanced presentation development workflow.
 *
 * Priority mapping:
 * - high: Critical path tasks that block other work
 * - medium: Standard workflow tasks
 * - low: Optional or enhancement tasks
 */
export const PRESENTATION_TASKS: CreateTaskInput[] = [
	// ============================================================
	// Phase 1: Discovery & Research (4 tasks)
	// ============================================================
	{
		title: "Research your topic deeply",
		description:
			"[Phase 1: Discovery & Research] Build subject matter expertise before you can teach others",
		status: "do",
		priority: "high",
	},
	{
		title: "Analyze competing or similar presentations",
		description:
			"[Phase 1: Discovery & Research] Review what has worked before in this space - TED talks, industry presentations, competitor decks",
		status: "do",
		priority: "medium",
	},
	{
		title: "Identify constraints and logistics",
		description:
			"[Phase 1: Discovery & Research] Time limits, venue, technical setup, audience size, remote vs in-person",
		status: "do",
		priority: "high",
	},
	{
		title: "Define success metrics",
		description:
			"[Phase 1: Discovery & Research] How will you know if the presentation succeeded? What actions or outcomes do you want?",
		status: "do",
		priority: "medium",
	},

	// ============================================================
	// Phase 2: The Start (10 tasks)
	// ============================================================
	{
		title: "Stay out of PowerPoint!",
		description:
			"[Phase 2: The Start] Resist the urge to open PowerPoint too early in the process",
		status: "do",
		priority: "high",
	},
	{
		title: "Select a presentation for your project",
		description:
			"[Phase 2: The Start] Choose a real presentation to work on throughout the process",
		status: "do",
		priority: "high",
	},
	{
		title: "Identify the audience for your presentation",
		description:
			"[Phase 2: The Start] Determine who will be receiving your presentation",
		status: "do",
		priority: "high",
	},
	{
		title: "Create an audience map",
		description:
			"[Phase 2: The Start] Document key characteristics, needs, expectations, and knowledge level of your audience",
		status: "do",
		priority: "high",
	},
	{
		title: "Identify audience pain points and motivations",
		description:
			"[Phase 2: The Start] What problems does your audience face? What do they care about most?",
		status: "do",
		priority: "medium",
	},
	{
		title: "Build the context portion of your introduction",
		description:
			"[Phase 2: The Start] Identify what your audience already knows and establish common ground",
		status: "do",
		priority: "high",
	},
	{
		title: "Determine the catalyst for the presentation",
		description:
			"[Phase 2: The Start] What has happened that has created the need for this presentation?",
		status: "do",
		priority: "high",
	},
	{
		title: "Determine the central question you are answering",
		description:
			"[Phase 2: The Start] Clarify the central question your presentation addresses",
		status: "do",
		priority: "high",
	},
	{
		title: "Write down a single goal or next step",
		description:
			"[Phase 2: The Start] Define the ultimate objective of your presentation - the ONE thing",
		status: "do",
		priority: "high",
	},
	{
		title: "Plan the Action Agenda for the first 72 hours",
		description:
			"[Phase 2: The Start] Think about the component pieces of your goal and immediate next steps",
		status: "do",
		priority: "medium",
	},

	// ============================================================
	// Phase 3: Structure (10 tasks)
	// ============================================================
	{
		title: "Gather content to answer your question",
		description:
			"[Phase 3: Structure] Collect existing content, data, research, and new analysis",
		status: "do",
		priority: "high",
	},
	{
		title: "Run a brainstorming session",
		description:
			"[Phase 3: Structure] Generate new ideas and approaches - write everything down without judgment",
		status: "do",
		priority: "high",
	},
	{
		title: "Select a visual thinking tool",
		description:
			"[Phase 3: Structure] Choose a method to organize and visualize your thoughts (mind map, sticky notes, etc.)",
		status: "do",
		priority: "medium",
	},
	{
		title: "Define your key message hierarchy",
		description:
			"[Phase 3: Structure] What's the ONE thing they must remember? What are the 3-5 supporting points?",
		status: "do",
		priority: "high",
	},
	{
		title: "Create an Argument Map",
		description:
			"[Phase 3: Structure] Visually map out your reasoning structure for your answer",
		status: "do",
		priority: "high",
	},
	{
		title: "Build an inductive argument",
		description:
			"[Phase 3: Structure] Build logical support for your conclusion from evidence to claim",
		status: "do",
		priority: "high",
	},
	{
		title: "Structure evidence into MECE groups",
		description:
			"[Phase 3: Structure] Organize supporting evidence into mutually exclusive, collectively exhaustive groups (4-5 max)",
		status: "do",
		priority: "high",
	},
	{
		title: "Develop the 'so what?' for each point",
		description:
			"[Phase 3: Structure] For every piece of content, answer: Why should the audience care?",
		status: "do",
		priority: "high",
	},
	{
		title: "Build transitions between sections",
		description:
			"[Phase 3: Structure] Plan how ideas flow together - create bridges between major sections",
		status: "do",
		priority: "medium",
	},
	{
		title: "Identify potential objections and questions",
		description:
			"[Phase 3: Structure] Anticipate pushback and prepare responses - address objections proactively",
		status: "do",
		priority: "medium",
	},

	// ============================================================
	// Phase 4: Storytelling (8 tasks)
	// ============================================================
	{
		title: "Identify where to inject stories",
		description:
			"[Phase 4: Storytelling] Find opportunities for narrative elements in your presentation",
		status: "do",
		priority: "medium",
	},
	{
		title: "Determine story placement",
		description:
			"[Phase 4: Storytelling] Consider adding stories at the beginning (hook), middle (illustration), or end (inspiration)",
		status: "do",
		priority: "medium",
	},
	{
		title: "Design stories that stick",
		description:
			"[Phase 4: Storytelling] Make your stories memorable using concrete details, emotion, and unexpectedness",
		status: "do",
		priority: "medium",
	},
	{
		title: "Gather supporting evidence for your stories",
		description:
			"[Phase 4: Storytelling] Stories need credibility - collect data, quotes, or visuals that reinforce them",
		status: "do",
		priority: "medium",
	},
	{
		title: "Map the emotional arc",
		description:
			"[Phase 4: Storytelling] Plan where the highs and lows are - tension, relief, inspiration, call to action",
		status: "do",
		priority: "medium",
	},
	{
		title: "Create your storyboard on paper",
		description:
			"[Phase 4: Storytelling] Draft your presentation flow on paper or sticky notes first - one idea per 'slide'",
		status: "do",
		priority: "high",
	},
	{
		title: "Iterate the storyboard several times",
		description:
			"[Phase 4: Storytelling] Refine focusing first on key messages, then flow, then supporting arguments",
		status: "do",
		priority: "high",
	},
	{
		title: "Test story resonance with a sample audience",
		description:
			"[Phase 4: Storytelling] Share your storyboard with 1-2 trusted people - does the narrative land?",
		status: "do",
		priority: "medium",
	},

	// ============================================================
	// Phase 5: Design (9 tasks)
	// ============================================================
	{
		title: "Refine storyboard for visual balance",
		description:
			"[Phase 5: Design] Strike the balance between text and visual forms (charts, graphs, diagrams)",
		status: "do",
		priority: "medium",
	},
	{
		title: "Create a color palette",
		description:
			"[Phase 5: Design] Use Adobe Color Wheel or similar tool to define your presentation's color scheme",
		status: "do",
		priority: "medium",
	},
	{
		title: "Select custom fonts",
		description:
			"[Phase 5: Design] Choose complementary fonts for headings and body text, download and install",
		status: "do",
		priority: "medium",
	},
	{
		title: "Create a master slide template",
		description:
			"[Phase 5: Design] Build consistent layouts before creating individual slides - title, content, section dividers",
		status: "do",
		priority: "high",
	},
	{
		title: "Design title slide and section dividers",
		description:
			"[Phase 5: Design] First impressions matter - create a compelling opening visual",
		status: "do",
		priority: "medium",
	},
	{
		title: "Build an icon and image library",
		description:
			"[Phase 5: Design] Gather consistent visual assets - icons, photos, illustrations in a unified style",
		status: "do",
		priority: "medium",
	},
	{
		title: "Review storyboard for design principle violations",
		description:
			"[Phase 5: Design] Check whitespace, alignment, proximity, contrast, and repetition",
		status: "do",
		priority: "medium",
	},
	{
		title: "Design your slides in detail",
		description:
			"[Phase 5: Design] Move beyond storyboarding and start actual slide creation",
		status: "do",
		priority: "high",
	},
	{
		title: "Create a handout or leave-behind version",
		description:
			"[Phase 5: Design] Design a version suitable for distribution after the presentation",
		status: "do",
		priority: "low",
	},

	// ============================================================
	// Phase 6: Data Visualization (6 tasks)
	// ============================================================
	{
		title: "Validate data accuracy",
		description:
			"[Phase 6: Data Visualization] Fact-check all data before visualizing - verify sources and calculations",
		status: "do",
		priority: "high",
	},
	{
		title: "Decide tables vs graphs for your data",
		description:
			"[Phase 6: Data Visualization] Choose the right format for each data point based on the story you're telling",
		status: "do",
		priority: "medium",
	},
	{
		title: "Create basic charts",
		description:
			"[Phase 6: Data Visualization] Apply best practices for bar charts, line charts, and pie charts",
		status: "do",
		priority: "medium",
	},
	{
		title: "Consider specialized chart types",
		description:
			"[Phase 6: Data Visualization] Explore waterfall charts, scatter plots, and other advanced visualizations if appropriate",
		status: "do",
		priority: "low",
	},
	{
		title: "Add source citations to data",
		description:
			"[Phase 6: Data Visualization] Include sources for credibility - small text at bottom of data slides",
		status: "do",
		priority: "medium",
	},
	{
		title: "Create animation and build sequences",
		description:
			"[Phase 6: Data Visualization] Plan progressive disclosure of complex data - reveal data points sequentially",
		status: "do",
		priority: "low",
	},

	// ============================================================
	// Phase 7: Review & Refinement (6 tasks)
	// ============================================================
	{
		title: "Conduct peer review of content",
		description:
			"[Phase 7: Review & Refinement] Get expert feedback on accuracy, logic, and persuasiveness",
		status: "do",
		priority: "high",
	},
	{
		title: "Conduct design review",
		description:
			"[Phase 7: Review & Refinement] Fresh eyes on visual consistency, readability, and professional appearance",
		status: "do",
		priority: "medium",
	},
	{
		title: "Perform accessibility check",
		description:
			"[Phase 7: Review & Refinement] Verify color contrast, font sizes, alt text for images, and screen reader compatibility",
		status: "do",
		priority: "medium",
	},
	{
		title: "Complete legal and compliance review",
		description:
			"[Phase 7: Review & Refinement] If presenting externally, verify trademarks, confidential info, and regulatory compliance",
		status: "do",
		priority: "high",
	},
	{
		title: "Final proofread",
		description:
			"[Phase 7: Review & Refinement] Check for typos, grammar, consistency in terminology, and formatting",
		status: "do",
		priority: "high",
	},
	{
		title: "Incorporate feedback and finalize",
		description:
			"[Phase 7: Review & Refinement] Address review comments and lock the final version",
		status: "do",
		priority: "high",
	},

	// ============================================================
	// Phase 8: Performance (11 tasks)
	// ============================================================
	{
		title: "Write your voiceover script",
		description:
			"[Phase 8: Performance] Document what you will say for each slide - word for word initially",
		status: "do",
		priority: "high",
	},
	{
		title: "Create speaker notes",
		description:
			"[Phase 8: Performance] Condense script into bullet-point reminders for each slide - not full sentences",
		status: "do",
		priority: "medium",
	},
	{
		title: "Memorize your script",
		description:
			"[Phase 8: Performance] Know your content well enough to deliver naturally without reading",
		status: "do",
		priority: "high",
	},
	{
		title: "Prepare for Q&A",
		description:
			"[Phase 8: Performance] Anticipate 10-15 likely questions and prepare concise answers",
		status: "do",
		priority: "high",
	},
	{
		title: "Create backup slides for Q&A",
		description:
			"[Phase 8: Performance] Build an appendix with supporting data for anticipated questions",
		status: "do",
		priority: "medium",
	},
	{
		title: "Test presentation length and edit to fit time",
		description:
			"[Phase 8: Performance] Time yourself and cut or expand to fit the allotted time (aim for 80% to allow for Q&A)",
		status: "do",
		priority: "high",
	},
	{
		title: "Conduct technical rehearsal",
		description:
			"[Phase 8: Performance] Test equipment, clicker, screen resolution, audio/video playback in actual venue if possible",
		status: "do",
		priority: "high",
	},
	{
		title: "Practice in front of others and solicit feedback",
		description:
			"[Phase 8: Performance] Do at least 2-3 full run-throughs with a live audience",
		status: "do",
		priority: "high",
	},
	{
		title: "Record and review yourself presenting",
		description:
			"[Phase 8: Performance] Record video and watch it critically - note verbal tics, pacing, eye contact",
		status: "do",
		priority: "medium",
	},
	{
		title: "Develop a 'Plan B' deck",
		description:
			"[Phase 8: Performance] Prepare a condensed 50% version for time-constrained situations",
		status: "do",
		priority: "low",
	},
	{
		title: "Prepare backup plans for technical failures",
		description:
			"[Phase 8: Performance] What if projector fails? No internet? Have PDF backup, printed handouts ready",
		status: "do",
		priority: "medium",
	},

	// ============================================================
	// Phase 9: Follow-Up (5 tasks)
	// ============================================================
	{
		title: "Send follow-up materials",
		description:
			"[Phase 9: Follow-Up] Distribute slides, handouts, or additional resources to attendees",
		status: "do",
		priority: "high",
	},
	{
		title: "Execute the Action Agenda",
		description:
			"[Phase 9: Follow-Up] Follow through on the next steps you promised in the presentation",
		status: "do",
		priority: "high",
	},
	{
		title: "Collect feedback from attendees",
		description:
			"[Phase 9: Follow-Up] Send a brief survey or request informal feedback on what worked",
		status: "do",
		priority: "medium",
	},
	{
		title: "Conduct personal retrospective",
		description:
			"[Phase 9: Follow-Up] What went well? What would you do differently? Document lessons learned",
		status: "do",
		priority: "medium",
	},
	{
		title: "Archive presentation materials",
		description:
			"[Phase 9: Follow-Up] Store final version, speaker notes, and feedback for future reference",
		status: "do",
		priority: "low",
	},
];

/**
 * Summary statistics for the presentation workflow.
 */
export const PRESENTATION_TASKS_SUMMARY = {
	totalPhases: 9,
	totalTasks: 69,
	tasksByPriority: {
		high: 33,
		medium: 27,
		low: 9,
	},
};
