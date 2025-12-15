/**
 * Presentation Development Workflow Tasks
 *
 * A comprehensive workflow organized into 5 phases, each containing
 * tasks with subtasks for individual steps. This hierarchical structure
 * provides better organization and progress tracking per phase.
 *
 * Source: apps/web/app/home/(user)/kanban/_lib/config/kanban-tasks.md
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
		id: "phase-1-the-start",
		name: "The Start",
		description:
			"Identify your audience, purpose, answer, and build your argument",
		order: 1,
		taskCount: 4,
	},
	{
		id: "phase-2-storytelling",
		name: "The Art of Storytelling",
		description: "Develop your outline, inject stories, and storyboard",
		order: 2,
		taskCount: 3,
	},
	{
		id: "phase-3-design",
		name: "The Harmony of Design",
		description: "Create templates and design each slide",
		order: 3,
		taskCount: 2,
	},
	{
		id: "phase-4-persuasion",
		name: "The Science of Fact-based Persuasion",
		description: "Develop compelling data visualizations",
		order: 4,
		taskCount: 1,
	},
	{
		id: "phase-5-the-how",
		name: "The How",
		description: "Review, practice, perform, and follow-up",
		order: 5,
		taskCount: 4,
	},
];

/**
 * Presentation development tasks organized hierarchically by phase.
 *
 * Each task is a parent containing subtasks for individual steps.
 * This structure provides:
 * - Clear task-level progress tracking
 * - Organized kanban board (14 cards across 5 phases)
 * - Better organization with expandable subtask details
 *
 * All 5 phases contain 14 tasks with a total of 59 subtasks.
 */
export const PRESENTATION_TASKS: CreateTaskInput[] = [
	// ============================================================
	// Phase 1: The Start (4 tasks, 16 subtasks)
	// ============================================================
	{
		title: "A. Identify WHO your audience is",
		description:
			"Determine who the hero of your presentation is - your audience",
		status: "do",
		priority: "high",
		phase: "The Start",
		subtasks: [
			{
				title:
					"Determine who the hero of your presentation is (hint: it is not you - it is your audience)",
				is_completed: false,
			},
			{
				title: "Profile your Audience using an Audience Map",
				is_completed: false,
			},
			{
				title: "Identify your audience's pain points and motivations",
				is_completed: false,
			},
		],
	},
	{
		title: "B. Determine WHY you are speaking with them",
		description: "Establish context, catalyst, question, and objectives",
		status: "do",
		priority: "high",
		phase: "The Start",
		subtasks: [
			{
				title: "Determine the Context of the Presentation",
				is_completed: false,
			},
			{
				title: "Identify the Catalyst of the Presentation or meeting",
				is_completed: false,
			},
			{
				title: "Determine the central Question your audience wants answered",
				is_completed: false,
			},
			{
				title: "Determine the Objective / Next Step for the Meeting",
				is_completed: false,
			},
			{
				title: "Plan the Action Agenda for the first 72 hours",
				is_completed: false,
			},
		],
	},
	{
		title: "C. Determine WHAT your answer is to your audience's question",
		description: "Gather existing work and develop new thinking",
		status: "do",
		priority: "high",
		phase: "The Start",
		subtasks: [
			{
				title: "Gather existing work and improve it",
				is_completed: false,
			},
			{
				title: "Develop new thinking - Run a brainstorming session",
				is_completed: false,
			},
			{
				title: "Summarize and organize your ideas",
				is_completed: false,
			},
		],
	},
	{
		title: "D. Build an argument map to define the logic of your Answer",
		description: "Structure your argument with evidence and logic",
		status: "do",
		priority: "high",
		phase: "The Start",
		subtasks: [
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
				title: "Focus on logical levels of abstraction",
				is_completed: false,
			},
			{
				title: "Identify potential objections and questions",
				is_completed: false,
			},
		],
	},

	// ============================================================
	// Phase 2: The Art of Storytelling (3 tasks, 8 subtasks)
	// ============================================================
	{
		title: "A. Develop a text-based outline of the presentation",
		description: "Convert your argument into a structured outline",
		status: "do",
		priority: "high",
		phase: "The Art of Storytelling",
		subtasks: [
			{
				title:
					"Develop your Introduction with your Context, Catalyst and Question",
				is_completed: false,
			},
			{
				title:
					"Convert your argument map to a set of bullets that Answer your audience's Question",
				is_completed: false,
			},
			{
				title: "Focus on main 'headline' messages as main bullets",
				is_completed: false,
			},
			{
				title: "Create supporting ideas as sub-bullets under your main bullets",
				is_completed: false,
			},
		],
	},
	{
		title: "B. Identify where to potentially inject stories",
		description: "Design memorable stories and test their resonance",
		status: "do",
		priority: "medium",
		phase: "The Art of Storytelling",
		subtasks: [
			{
				title: "Design stories that stick",
				is_completed: false,
			},
			{
				title: "Test story resonance with a sample audience",
				is_completed: false,
			},
		],
	},
	{
		title: "C. Storyboard the presentation",
		description: "Visualize your outline as a storyboard",
		status: "do",
		priority: "high",
		phase: "The Art of Storytelling",
		subtasks: [
			{
				title: "Convert the outline into a storyboard",
				is_completed: false,
			},
			{
				title: "Start to think about how to visually communicate your ideas",
				is_completed: false,
			},
		],
	},

	// ============================================================
	// Phase 3: The Harmony of Design (2 tasks, 11 subtasks)
	// ============================================================
	{
		title: "A. Develop a Slide Template",
		description: "Create consistent visual foundation",
		status: "do",
		priority: "high",
		phase: "The Harmony of Design",
		subtasks: [
			{
				title: "Use ours (or create your own)",
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
				title: "Design title slide and section dividers",
				is_completed: false,
			},
			{
				title: "Build an icon and image library",
				is_completed: false,
			},
		],
	},
	{
		title: "B. Design each slide",
		description: "Create individual slides with proper design",
		status: "do",
		priority: "high",
		phase: "The Harmony of Design",
		subtasks: [
			{
				title: "Write out each heading for each slide",
				is_completed: false,
			},
			{
				title:
					"Write out each sub-heading for each supporting piece of evidence/chart",
				is_completed: false,
			},
			{
				title: "Design charts and supporting visuals",
				is_completed: false,
			},
			{
				title: "Open PowerPoint!",
				is_completed: false,
			},
			{
				title: "Populate slides with supporting evidence",
				is_completed: false,
			},
			{
				title: "Review slides for design principle violations",
				is_completed: false,
			},
		],
	},

	// ============================================================
	// Phase 4: The Science of Fact-based Persuasion (1 task, 5 subtasks)
	// ============================================================
	{
		title: "A. Develop Graphs and Tables for your data",
		description: "Create compelling data visualizations",
		status: "do",
		priority: "high",
		phase: "The Science of Fact-based Persuasion",
		subtasks: [
			{
				title:
					"Determine what tables or chart types are best for the data you wish to show",
				is_completed: false,
			},
			{
				title: "Create the tables or charts",
				is_completed: false,
			},
			{
				title: "Reduce and eliminate chart-junk",
				is_completed: false,
			},
			{
				title:
					"Design tables and graphs to emphasize the key data elements that support your story",
				is_completed: false,
			},
			{
				title: "Add source citations to data",
				is_completed: false,
			},
		],
	},

	// ============================================================
	// Phase 5: The How (4 tasks, 19 subtasks)
	// ============================================================
	{
		title: "A. Review",
		description: "Quality assurance and feedback incorporation",
		status: "do",
		priority: "high",
		phase: "The How",
		subtasks: [
			{
				title: "Conduct peer review of content",
				is_completed: false,
			},
			{
				title: "Complete legal and compliance review",
				is_completed: false,
			},
			{
				title: "Conduct final proofread",
				is_completed: false,
			},
			{
				title: "Incorporate feedback and finalize",
				is_completed: false,
			},
		],
	},
	{
		title: "B. Practice",
		description: "Rehearse and refine your delivery",
		status: "do",
		priority: "high",
		phase: "The How",
		subtasks: [
			{
				title:
					"Do an initial run through of the presentation. Speak the presentation out loud and improvise",
				is_completed: false,
			},
			{
				title: "Write this version down as a formal script",
				is_completed: false,
			},
			{
				title:
					"Run through the presentation two or three more times working on length, simplifying language",
				is_completed: false,
			},
			{
				title:
					"If the length needs editing, revise the presentation, eliminating or combining slide ideas",
				is_completed: false,
			},
			{
				title:
					"Present to someone else to solicit feedback and simulate a 'live' presentation",
				is_completed: false,
			},
			{
				title: "Run through the script a few more times and then park it",
				is_completed: false,
			},
			{
				title:
					"Get a good night's sleep; review the script once or twice just before the presentation",
				is_completed: false,
			},
		],
	},
	{
		title: "C. Perform",
		description: "Deliver your presentation with impact",
		status: "do",
		priority: "high",
		phase: "The How",
		subtasks: [
			{
				title:
					"Conduct a pre-presentation flight-check to ensure you have everything you need",
				is_completed: false,
			},
			{
				title: "Deliver with conviction, passion and drama",
				is_completed: false,
			},
			{
				title: "Focus on managing stress",
				is_completed: false,
			},
			{
				title: "Answer the Audience's questions",
				is_completed: false,
			},
		],
	},
	{
		title: "D. Follow-up",
		description: "Post-presentation activities and continuous improvement",
		status: "do",
		priority: "medium",
		phase: "The How",
		subtasks: [
			{
				title: "Execute the Action Agenda",
				is_completed: false,
			},
			{
				title: "Send follow-up materials",
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
 * - totalTasks = 14 (tasks across 5 phases)
 * - totalSubtasks = 59 (individual action items)
 */
export const PRESENTATION_TASKS_SUMMARY = {
	totalPhases: 5,
	totalTasks: 14,
	totalSubtasks: 59,
	subtasksByPhase: {
		"the-start": 16,
		storytelling: 8,
		design: 11,
		persuasion: 5,
		"the-how": 19,
	},
};
