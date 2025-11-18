import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Custom phase for organizing user stories
interface CustomPhase {
	id: string;
	name: string;
	description: string;
	color: string; // Tailwind color class
	order: number;
	userStoryIds: string[];
}

// Business-focused user story following ChatPRD best practices
interface UserStory {
	id: string;
	title: string;
	userStory: string;
	businessValue: string;
	acceptanceCriteria: string[];
	status:
		| "not_started"
		| "research"
		| "in_progress"
		| "review"
		| "completed"
		| "blocked";
	priority: "P0" | "P1" | "P2" | "P3";
	estimatedComplexity: "XS" | "S" | "M" | "L" | "XL";
	dependencies: string[];
	notes?: string;
	completedAt?: string;
}

// Structured PRD following ChatPRD format
interface StructuredPRD {
	introduction: {
		title: string;
		overview: string;
		lastUpdated: string;
	};

	problemStatement: {
		problem: string;
		marketOpportunity: string;
		targetUsers: string[];
	};

	solutionOverview: {
		description: string;
		keyFeatures: string[];
		successMetrics: string[];
	};

	userStories: UserStory[];
	customPhases?: CustomPhase[];

	technicalRequirements: {
		constraints: string[];
		integrationNeeds: string[];
		complianceRequirements: string[];
	};

	acceptanceCriteria: {
		global: string[];
		qualityStandards: string[];
	};

	constraints: {
		timeline: string;
		budget?: string;
		resources: string[];
		nonNegotiables: string[];
	};

	metadata: {
		version: string;
		created: string;
		lastUpdated: string;
		approver: string;
	};

	progress: {
		overall: number;
		completed: number;
		total: number;
		blocked: number;
	};
}

// biome-ignore lint/complexity/noStaticOnlyClass: PRDManager uses static methods as a namespace pattern for utility functions
export class PRDManager {
	// biome-ignore lint/correctness/noUnusedPrivateClassMembers: Used by PRDS_DIR getter and setRootPath
	private static ROOT_PATH = process.cwd();

	// biome-ignore lint/correctness/noUnusedPrivateClassMembers: Used throughout class for file operations
	private static get PRDS_DIR() {
		return join(PRDManager.ROOT_PATH, ".prds");
	}

	static setRootPath(path: string) {
		PRDManager.ROOT_PATH = path;
	}

	static async ensurePRDsDirectory(): Promise<void> {
		try {
			await mkdir(PRDManager.PRDS_DIR, { recursive: true });
		} catch {
			// Directory exists
		}
	}

	static async createStructuredPRD(
		title: string,
		overview: string,
		problemStatement: string,
		marketOpportunity: string,
		targetUsers: string[],
		solutionDescription: string,
		keyFeatures: string[],
		successMetrics: string[],
	): Promise<string> {
		await PRDManager.ensurePRDsDirectory();

		const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
		const now = new Date().toISOString().split("T")[0];

		const prd: StructuredPRD = {
			introduction: {
				title,
				overview,
				lastUpdated: now,
			},
			problemStatement: {
				problem: problemStatement,
				marketOpportunity,
				targetUsers,
			},
			solutionOverview: {
				description: solutionDescription,
				keyFeatures,
				successMetrics,
			},
			userStories: [],
			technicalRequirements: {
				constraints: [],
				integrationNeeds: [],
				complianceRequirements: [],
			},
			acceptanceCriteria: {
				global: [],
				qualityStandards: [],
			},
			constraints: {
				timeline: "",
				resources: [],
				nonNegotiables: [],
			},
			metadata: {
				version: "1.0",
				created: now,
				lastUpdated: now,
				approver: "",
			},
			progress: {
				overall: 0,
				completed: 0,
				total: 0,
				blocked: 0,
			},
		};

		const filePath = join(PRDManager.PRDS_DIR, filename);
		await writeFile(filePath, JSON.stringify(prd, null, 2), "utf8");

		return filename;
	}

	static async addUserStory(
		filename: string,
		userType: string,
		action: string,
		benefit: string,
		acceptanceCriteria: string[],
		priority: UserStory["priority"] = "P2",
	): Promise<string> {
		const prd = await PRDManager.loadPRD(filename);

		const userStory = `As a ${userType}, I want to ${action} so that ${benefit}`;
		const title = PRDManager.extractTitleFromAction(action);
		const complexity = PRDManager.assessComplexity(acceptanceCriteria);

		const storyNumber = prd.userStories.length + 1;
		const storyId = `US${storyNumber.toString().padStart(3, "0")}`;

		const newStory: UserStory = {
			id: storyId,
			title,
			userStory,
			businessValue: benefit,
			acceptanceCriteria,
			status: "not_started",
			priority,
			estimatedComplexity: complexity,
			dependencies: [],
		};

		prd.userStories.push(newStory);
		PRDManager.updateProgress(prd);

		await PRDManager.savePRD(filename, prd);

		return `User story ${storyId} added: "${title}"`;
	}

	static async updateStoryStatus(
		filename: string,
		storyId: string,
		status: UserStory["status"],
		notes?: string,
	): Promise<string> {
		const prd = await PRDManager.loadPRD(filename);
		const story = prd.userStories.find((s) => s.id === storyId);

		if (!story) {
			throw new Error(`Story ${storyId} not found`);
		}

		story.status = status;
		if (notes) {
			story.notes = notes;
		}
		if (status === "completed") {
			story.completedAt = new Date().toISOString().split("T")[0];
		}

		PRDManager.updateProgress(prd);
		await PRDManager.savePRD(filename, prd);

		return `Story "${story.title}" updated to ${status}. Progress: ${prd.progress.overall}%`;
	}

	static async exportAsMarkdown(filename: string): Promise<string> {
		const prd = await PRDManager.loadPRD(filename);
		const content = PRDManager.formatPRDMarkdown(prd);

		const markdownFile = filename.replace(".json", ".md");
		const markdownPath = join(PRDManager.PRDS_DIR, markdownFile);
		await writeFile(markdownPath, content, "utf8");

		return markdownFile;
	}

	static async generateImplementationPrompts(
		filename: string,
	): Promise<string[]> {
		const prd = await PRDManager.loadPRD(filename);
		const prompts: string[] = [];

		prompts.push(
			`Implement "${prd.introduction.title}" based on the PRD. ` +
				`Goal: ${prd.solutionOverview.description}. ` +
				`Key features: ${prd.solutionOverview.keyFeatures.join(", ")}. ` +
				"You must research and decide all technical implementation details.",
		);

		const readyStories = prd.userStories.filter(
			(s) => s.status === "not_started",
		);
		readyStories.slice(0, 3).forEach((story) => {
			prompts.push(
				`Implement ${story.id}: "${story.userStory}". ` +
					`Business value: ${story.businessValue}. ` +
					`Acceptance criteria: ${story.acceptanceCriteria.join(" | ")}. ` +
					"Research technical approach and implement.",
			);
		});

		return prompts;
	}

	static async getImprovementSuggestions(filename: string): Promise<string[]> {
		const prd = await PRDManager.loadPRD(filename);
		const suggestions: string[] = [];

		if (prd.userStories.length === 0) {
			suggestions.push("Add user stories to define specific functionality");
		}

		if (prd.solutionOverview.successMetrics.length === 0) {
			suggestions.push("Define success metrics to measure progress");
		}

		if (prd.acceptanceCriteria.global.length === 0) {
			suggestions.push("Add global acceptance criteria for quality standards");
		}

		const vagueStories = prd.userStories.filter(
			(s) => s.acceptanceCriteria.length < 2,
		);
		if (vagueStories.length > 0) {
			suggestions.push(
				`${vagueStories.length} stories need more detailed acceptance criteria`,
			);
		}

		const blockedStories = prd.userStories.filter(
			(s) => s.status === "blocked",
		);
		if (blockedStories.length > 0) {
			suggestions.push(
				`${blockedStories.length} stories are blocked and need attention`,
			);
		}

		return suggestions;
	}

	static async listPRDs(): Promise<string[]> {
		await PRDManager.ensurePRDsDirectory();

		try {
			const files = await readdir(PRDManager.PRDS_DIR);

			return files.filter((file) => file.endsWith(".json"));
		} catch {
			return [];
		}
	}

	static async getPRDContent(filename: string): Promise<string> {
		const filePath = join(PRDManager.PRDS_DIR, filename);
		try {
			return await readFile(filePath, "utf8");
		} catch {
			throw new Error(`PRD file "${filename}" not found`);
		}
	}

	static async getProjectStatus(filename: string): Promise<{
		progress: number;
		summary: string;
		nextSteps: string[];
		blockers: UserStory[];
	}> {
		const prd = await PRDManager.loadPRD(filename);

		const blockers = prd.userStories.filter((s) => s.status === "blocked");
		const inProgress = prd.userStories.filter(
			(s) => s.status === "in_progress",
		);
		const nextPending = prd.userStories
			.filter((s) => s.status === "not_started")
			.slice(0, 3);

		const nextSteps = [
			...inProgress.map((s) => `Continue: ${s.title}`),
			...nextPending.map((s) => `Start: ${s.title}`),
		];

		const summary = `${prd.progress.completed}/${prd.progress.total} stories completed (${prd.progress.overall}%). Total stories: ${prd.userStories.length}`;

		return {
			progress: prd.progress.overall,
			summary,
			nextSteps,
			blockers,
		};
	}

	// Custom Phase Management
	static async createCustomPhase(
		filename: string,
		name: string,
		description: string,
		color: string,
	): Promise<string> {
		const prd = await PRDManager.loadPRD(filename);

		// Initialize customPhases if it doesn't exist
		if (!prd.customPhases) {
			prd.customPhases = [];
		}

		// Check for unique name
		if (prd.customPhases.some((p) => p.name === name)) {
			throw new Error(`Phase with name "${name}" already exists`);
		}

		const phaseId = `PHASE${(prd.customPhases.length + 1).toString().padStart(3, "0")}`;
		const order = prd.customPhases.length;

		const newPhase: CustomPhase = {
			id: phaseId,
			name,
			description,
			color,
			order,
			userStoryIds: [],
		};

		prd.customPhases.push(newPhase);
		await PRDManager.savePRD(filename, prd);

		return `Custom phase "${name}" created with ID ${phaseId}`;
	}

	static async updateCustomPhase(
		filename: string,
		phaseId: string,
		updates: Partial<Pick<CustomPhase, "name" | "description" | "color">>,
	): Promise<string> {
		const prd = await PRDManager.loadPRD(filename);

		if (!prd.customPhases) {
			throw new Error("No custom phases found in this PRD");
		}

		const phase = prd.customPhases.find((p) => p.id === phaseId);
		if (!phase) {
			throw new Error(`Phase ${phaseId} not found`);
		}

		// Check for unique name if updating name
		if (updates.name && updates.name !== phase.name) {
			if (
				prd.customPhases.some(
					(p) => p.name === updates.name && p.id !== phaseId,
				)
			) {
				throw new Error(`Phase with name "${updates.name}" already exists`);
			}
		}

		Object.assign(phase, updates);
		await PRDManager.savePRD(filename, prd);

		return `Phase "${phase.name}" updated successfully`;
	}

	static async deleteCustomPhase(
		filename: string,
		phaseId: string,
		reassignToPhaseId?: string,
	): Promise<string> {
		const prd = await PRDManager.loadPRD(filename);

		if (!prd.customPhases) {
			throw new Error("No custom phases found in this PRD");
		}

		const phaseIndex = prd.customPhases.findIndex((p) => p.id === phaseId);
		if (phaseIndex === -1) {
			throw new Error(`Phase ${phaseId} not found`);
		}

		const phase = prd.customPhases[phaseIndex];

		// Handle story reassignment
		if (phase.userStoryIds.length > 0) {
			if (reassignToPhaseId) {
				const targetPhase = prd.customPhases.find(
					(p) => p.id === reassignToPhaseId,
				);
				if (!targetPhase) {
					throw new Error(
						`Target phase ${reassignToPhaseId} not found for reassignment`,
					);
				}
				targetPhase.userStoryIds.push(...phase.userStoryIds);
			} else {
				throw new Error(
					`Phase "${phase.name}" contains ${phase.userStoryIds.length} user stories. Provide reassignToPhaseId or move stories first.`,
				);
			}
		}

		prd.customPhases.splice(phaseIndex, 1);
		await PRDManager.savePRD(filename, prd);

		return `Phase "${phase.name}" deleted successfully`;
	}

	static async assignStoryToPhase(
		filename: string,
		storyId: string,
		phaseId: string,
	): Promise<string> {
		const prd = await PRDManager.loadPRD(filename);

		if (!prd.customPhases) {
			throw new Error("No custom phases found in this PRD");
		}

		const story = prd.userStories.find((s) => s.id === storyId);
		if (!story) {
			throw new Error(`Story ${storyId} not found`);
		}

		const targetPhase = prd.customPhases.find((p) => p.id === phaseId);
		if (!targetPhase) {
			throw new Error(`Phase ${phaseId} not found`);
		}

		// Remove story from all phases first
		prd.customPhases.forEach((phase) => {
			phase.userStoryIds = phase.userStoryIds.filter((id) => id !== storyId);
		});

		// Add to target phase
		if (!targetPhase.userStoryIds.includes(storyId)) {
			targetPhase.userStoryIds.push(storyId);
		}

		await PRDManager.savePRD(filename, prd);

		return `Story "${story.title}" assigned to phase "${targetPhase.name}"`;
	}

	static async getCustomPhases(filename: string): Promise<CustomPhase[]> {
		const prd = await PRDManager.loadPRD(filename);
		return prd.customPhases || [];
	}

	// Private methods
	// biome-ignore lint/correctness/noUnusedPrivateClassMembers: Core method used by all PRD operations
	private static async loadPRD(filename: string): Promise<StructuredPRD> {
		const filePath = join(PRDManager.PRDS_DIR, filename);
		try {
			const content = await readFile(filePath, "utf8");
			return JSON.parse(content);
		} catch {
			throw new Error(`PRD file "${filename}" not found`);
		}
	}

	// biome-ignore lint/correctness/noUnusedPrivateClassMembers: Core method used by all PRD write operations
	private static async savePRD(
		filename: string,
		prd: StructuredPRD,
	): Promise<void> {
		prd.metadata.lastUpdated = new Date().toISOString().split("T")[0];
		const filePath = join(PRDManager.PRDS_DIR, filename);
		await writeFile(filePath, JSON.stringify(prd, null, 2), "utf8");
	}
}

// MCP Server Tool Registration
export function registerPRDTools(server: McpServer) {
	createListPRDsTool(server);
	createGetPRDTool(server);
	createCreatePRDTool(server);
	createAddUserStoryTool(server);
	createUpdateStoryStatusTool(server);
	createExportMarkdownTool(server);
	createGetImplementationPromptsTool(server);
	createGetImprovementSuggestionsTool(server);
	createGetProjectStatusTool(server);
}

function createListPRDsTool(server: McpServer) {
	return server.tool("list_prds", {}, async () => {
		const prds = await PRDManager.listPRDs();

		if (prds.length === 0) {
			return {
				content: [
					{
						type: "text",
						text: "No PRD files found in .prds folder",
					},
				],
			};
		}

		const prdList = prds.map((prd) => `- ${prd}`).join("\n");

		return {
			content: [
				{
					type: "text",
					text: `Found ${prds.length} PRD files:\n\n${prdList}`,
				},
			],
		};
	});
}

function createGetPRDTool(server: McpServer) {
	return server.tool(
		"get_prd",
		{
			filename: z.string(),
		},
		async ({ filename }) => {
			const content = await PRDManager.getPRDContent(filename);

			return {
				content: [
					{
						type: "text",
						text: content,
					},
				],
			};
		},
	);
}

function createCreatePRDTool(server: McpServer) {
	return server.tool(
		"create_prd",
		{
			title: z.string(),
			overview: z.string(),
			problemStatement: z.string(),
			marketOpportunity: z.string(),
			targetUsers: z.array(z.string()),
			solutionDescription: z.string(),
			keyFeatures: z.array(z.string()),
			successMetrics: z.array(z.string()),
		},
		async ({
			title,
			overview,
			problemStatement,
			marketOpportunity,
			targetUsers,
			solutionDescription,
			keyFeatures,
			successMetrics,
		}) => {
			const filename = await PRDManager.createStructuredPRD(
				title,
				overview,
				problemStatement,
				marketOpportunity,
				targetUsers,
				solutionDescription,
				keyFeatures,
				successMetrics,
			);

			return {
				content: [
					{
						type: "text",
						text: `PRD created successfully: ${filename}`,
					},
				],
			};
		},
	);
}

function createAddUserStoryTool(server: McpServer) {
	return server.tool(
		"add_user_story",
		{
			filename: z.string(),
			userType: z.string(),
			action: z.string(),
			benefit: z.string(),
			acceptanceCriteria: z.array(z.string()),
			priority: z.enum(["P0", "P1", "P2", "P3"]).default("P2"),
		},
		async ({
			filename,
			userType,
			action,
			benefit,
			acceptanceCriteria,
			priority,
		}) => {
			const result = await PRDManager.addUserStory(
				filename,
				userType,
				action,
				benefit,
				acceptanceCriteria,
				priority,
			);

			return {
				content: [
					{
						type: "text",
						text: result,
					},
				],
			};
		},
	);
}

function createUpdateStoryStatusTool(server: McpServer) {
	return server.tool(
		"update_story_status",
		{
			filename: z.string(),
			storyId: z.string(),
			status: z.enum([
				"not_started",
				"research",
				"in_progress",
				"review",
				"completed",
				"blocked",
			]),
			notes: z.string().optional(),
		},
		async ({ filename, storyId, status, notes }) => {
			const result = await PRDManager.updateStoryStatus(
				filename,
				storyId,
				status,
				notes,
			);

			return {
				content: [
					{
						type: "text",
						text: result,
					},
				],
			};
		},
	);
}

function createExportMarkdownTool(server: McpServer) {
	return server.tool(
		"export_prd_markdown",
		{
			filename: z.string(),
		},
		async ({ filename }) => {
			const markdownFile = await PRDManager.exportAsMarkdown(filename);

			return {
				content: [
					{
						type: "text",
						text: `PRD exported as markdown: ${markdownFile}`,
					},
				],
			};
		},
	);
}

function createGetImplementationPromptsTool(server: McpServer) {
	return server.tool(
		"get_implementation_prompts",
		{
			filename: z.string(),
		},
		async ({ filename }) => {
			const prompts = await PRDManager.generateImplementationPrompts(filename);

			if (prompts.length === 0) {
				return {
					content: [
						{
							type: "text",
							text: "No implementation prompts available. Add user stories first.",
						},
					],
				};
			}

			const promptsList = prompts.map((p, i) => `${i + 1}. ${p}`).join("\n\n");

			return {
				content: [
					{
						type: "text",
						text: `Implementation prompts:\n\n${promptsList}`,
					},
				],
			};
		},
	);
}

function createGetImprovementSuggestionsTool(server: McpServer) {
	return server.tool(
		"get_improvement_suggestions",
		{
			filename: z.string(),
		},
		async ({ filename }) => {
			const suggestions = await PRDManager.getImprovementSuggestions(filename);

			if (suggestions.length === 0) {
				return {
					content: [
						{
							type: "text",
							text: "PRD looks good! No specific improvements suggested at this time.",
						},
					],
				};
			}

			const suggestionsList = suggestions.map((s) => `- ${s}`).join("\n");

			return {
				content: [
					{
						type: "text",
						text: `Improvement suggestions:\n\n${suggestionsList}`,
					},
				],
			};
		},
	);
}

function createGetProjectStatusTool(server: McpServer) {
	return server.tool(
		"get_project_status",
		{
			filename: z.string(),
		},
		async ({ filename }) => {
			const status = await PRDManager.getProjectStatus(filename);

			let result = "**Project Status**\n\n";
			result += `${status.summary}\n\n`;

			if (status.nextSteps.length > 0) {
				result += "**Next Steps:**\n";
				status.nextSteps.forEach((step) => {
					result += `- ${step}\n`;
				});
				result += "\n";
			}

			if (status.blockers.length > 0) {
				result += "**Blockers:**\n";
				status.blockers.forEach((blocker) => {
					result += `- ${blocker.title}: ${blocker.notes || "No details provided"}\n`;
				});
			}

			return {
				content: [
					{
						type: "text",
						text: result,
					},
				],
			};
		},
	);
}
