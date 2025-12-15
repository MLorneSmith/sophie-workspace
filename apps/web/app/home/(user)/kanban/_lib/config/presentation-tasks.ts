/**
 * Presentation Development Workflow Tasks
 *
 * A comprehensive workflow organized into 9 phase tasks, each containing
 * subtasks for individual steps. This hierarchical structure provides
 * better organization and progress tracking per phase.
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
 * Presentation development tasks organized hierarchically by phase.
 *
 * Each phase is a parent task containing subtasks for individual steps.
 * This structure provides:
 * - Clear phase-level progress tracking
 * - Less cluttered kanban board (9 cards vs 69)
 * - Better organization with expandable subtask details
 *
 * All 9 phases contain a total of 69 subtasks derived from the
 * enhanced presentation development workflow.
 */
export const PRESENTATION_TASKS: CreateTaskInput[] = [
	// ============================================================
	// Phase 1: Discovery & Research (4 subtasks)
	// ============================================================
	{
		title: "Phase 1: Discovery & Research",
		description: "Understand your topic, audience, and context before planning",
		status: "do",
		priority: "high",
		subtasks: [
			{
				title: "Research your topic deeply",
				is_completed: false,
			},
			{
				title: "Analyze competing or similar presentations",
				is_completed: false,
			},
			{
				title: "Identify constraints and logistics",
				is_completed: false,
			},
			{
				title: "Define success metrics",
				is_completed: false,
			},
		],
	},

	// ============================================================
	// Phase 2: The Start (10 subtasks)
	// ============================================================
	{
		title: "Phase 2: The Start",
		description: "Define your audience and presentation goals",
		status: "do",
		priority: "high",
		subtasks: [
			{
				title: "Stay out of PowerPoint!",
				is_completed: false,
			},
			{
				title: "Select a presentation for your project",
				is_completed: false,
			},
			{
				title: "Identify the audience for your presentation",
				is_completed: false,
			},
			{
				title: "Create an audience map",
				is_completed: false,
			},
			{
				title: "Identify audience pain points and motivations",
				is_completed: false,
			},
			{
				title: "Build the context portion of your introduction",
				is_completed: false,
			},
			{
				title: "Determine the catalyst for the presentation",
				is_completed: false,
			},
			{
				title: "Determine the central question you are answering",
				is_completed: false,
			},
			{
				title: "Write down a single goal or next step",
				is_completed: false,
			},
			{
				title: "Plan the Action Agenda for the first 72 hours",
				is_completed: false,
			},
		],
	},

	// ============================================================
	// Phase 3: Structure (10 subtasks)
	// ============================================================
	{
		title: "Phase 3: Structure",
		description: "Generate and organize your ideas into a logical flow",
		status: "do",
		priority: "high",
		subtasks: [
			{
				title: "Gather content to answer your question",
				is_completed: false,
			},
			{
				title: "Run a brainstorming session",
				is_completed: false,
			},
			{
				title: "Select a visual thinking tool",
				is_completed: false,
			},
			{
				title: "Define your key message hierarchy",
				is_completed: false,
			},
			{
				title: "Create an Argument Map",
				is_completed: false,
			},
			{
				title: "Build an inductive argument",
				is_completed: false,
			},
			{
				title: "Structure evidence into MECE groups",
				is_completed: false,
			},
			{
				title: "Develop the 'so what?' for each point",
				is_completed: false,
			},
			{
				title: "Build transitions between sections",
				is_completed: false,
			},
			{
				title: "Identify potential objections and questions",
				is_completed: false,
			},
		],
	},

	// ============================================================
	// Phase 4: Storytelling (8 subtasks)
	// ============================================================
	{
		title: "Phase 4: Storytelling",
		description: "Craft your narrative arc and create the storyboard",
		status: "do",
		priority: "high",
		subtasks: [
			{
				title: "Identify where to inject stories",
				is_completed: false,
			},
			{
				title: "Determine story placement",
				is_completed: false,
			},
			{
				title: "Design stories that stick",
				is_completed: false,
			},
			{
				title: "Gather supporting evidence for your stories",
				is_completed: false,
			},
			{
				title: "Map the emotional arc",
				is_completed: false,
			},
			{
				title: "Create your storyboard on paper",
				is_completed: false,
			},
			{
				title: "Iterate the storyboard several times",
				is_completed: false,
			},
			{
				title: "Test story resonance with a sample audience",
				is_completed: false,
			},
		],
	},

	// ============================================================
	// Phase 5: Design (9 subtasks)
	// ============================================================
	{
		title: "Phase 5: Design",
		description: "Apply visual design principles and create slides",
		status: "do",
		priority: "high",
		subtasks: [
			{
				title: "Refine storyboard for visual balance",
				is_completed: false,
			},
			{
				title: "Create a color palette",
				is_completed: false,
			},
			{
				title: "Select custom fonts",
				is_completed: false,
			},
			{
				title: "Create a master slide template",
				is_completed: false,
			},
			{
				title: "Design title slide and section dividers",
				is_completed: false,
			},
			{
				title: "Build an icon and image library",
				is_completed: false,
			},
			{
				title: "Review storyboard for design principle violations",
				is_completed: false,
			},
			{
				title: "Design your slides in detail",
				is_completed: false,
			},
			{
				title: "Create a handout or leave-behind version",
				is_completed: false,
			},
		],
	},

	// ============================================================
	// Phase 6: Data Visualization (6 subtasks)
	// ============================================================
	{
		title: "Phase 6: Data Visualization",
		description: "Create effective charts, graphs, and data displays",
		status: "do",
		priority: "high",
		subtasks: [
			{
				title: "Validate data accuracy",
				is_completed: false,
			},
			{
				title: "Decide tables vs graphs for your data",
				is_completed: false,
			},
			{
				title: "Create basic charts",
				is_completed: false,
			},
			{
				title: "Consider specialized chart types",
				is_completed: false,
			},
			{
				title: "Add source citations to data",
				is_completed: false,
			},
			{
				title: "Create animation and build sequences",
				is_completed: false,
			},
		],
	},

	// ============================================================
	// Phase 7: Review & Refinement (6 subtasks)
	// ============================================================
	{
		title: "Phase 7: Review & Refinement",
		description: "Quality assurance and feedback incorporation",
		status: "do",
		priority: "high",
		subtasks: [
			{
				title: "Conduct peer review of content",
				is_completed: false,
			},
			{
				title: "Conduct design review",
				is_completed: false,
			},
			{
				title: "Perform accessibility check",
				is_completed: false,
			},
			{
				title: "Complete legal and compliance review",
				is_completed: false,
			},
			{
				title: "Final proofread",
				is_completed: false,
			},
			{
				title: "Incorporate feedback and finalize",
				is_completed: false,
			},
		],
	},

	// ============================================================
	// Phase 8: Performance (11 subtasks)
	// ============================================================
	{
		title: "Phase 8: Performance",
		description: "Prepare, practice, and deliver your presentation",
		status: "do",
		priority: "high",
		subtasks: [
			{
				title: "Write your voiceover script",
				is_completed: false,
			},
			{
				title: "Create speaker notes",
				is_completed: false,
			},
			{
				title: "Memorize your script",
				is_completed: false,
			},
			{
				title: "Prepare for Q&A",
				is_completed: false,
			},
			{
				title: "Create backup slides for Q&A",
				is_completed: false,
			},
			{
				title: "Test presentation length and edit to fit time",
				is_completed: false,
			},
			{
				title: "Conduct technical rehearsal",
				is_completed: false,
			},
			{
				title: "Practice in front of others and solicit feedback",
				is_completed: false,
			},
			{
				title: "Record and review yourself presenting",
				is_completed: false,
			},
			{
				title: "Develop a 'Plan B' deck",
				is_completed: false,
			},
			{
				title: "Prepare backup plans for technical failures",
				is_completed: false,
			},
		],
	},

	// ============================================================
	// Phase 9: Follow-Up (5 subtasks)
	// ============================================================
	{
		title: "Phase 9: Follow-Up",
		description: "Post-presentation activities and continuous improvement",
		status: "do",
		priority: "high",
		subtasks: [
			{
				title: "Send follow-up materials",
				is_completed: false,
			},
			{
				title: "Execute the Action Agenda",
				is_completed: false,
			},
			{
				title: "Collect feedback from attendees",
				is_completed: false,
			},
			{
				title: "Conduct personal retrospective",
				is_completed: false,
			},
			{
				title: "Archive presentation materials",
				is_completed: false,
			},
		],
	},
];

/**
 * Summary statistics for the presentation workflow.
 *
 * Note: With the hierarchical structure:
 * - totalTasks = 9 (one per phase)
 * - totalSubtasks = 69 (original tasks now as subtasks)
 */
export const PRESENTATION_TASKS_SUMMARY = {
	totalPhases: 9,
	totalTasks: 9,
	totalSubtasks: 69,
	subtasksByPhase: {
		"discovery-research": 4,
		"the-start": 10,
		structure: 10,
		storytelling: 8,
		design: 9,
		"data-visualization": 6,
		"review-refinement": 6,
		performance: 11,
		"follow-up": 5,
	},
};
