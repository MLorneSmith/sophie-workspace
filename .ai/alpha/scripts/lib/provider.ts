/**
 * Provider utilities for running different agent CLIs in sandboxes.
 */

import {
	GPT_TEMPLATE_ALIAS,
	TEMPLATE_ALIAS,
	WORKSPACE_DIR,
} from "../config/index.js";
import type { AgentProvider } from "../types/index.js";

export function getTemplateAlias(provider: AgentProvider): string {
	return provider === "gpt" ? GPT_TEMPLATE_ALIAS : TEMPLATE_ALIAS;
}

export function getProviderDisplayName(provider: AgentProvider): string {
	return provider === "gpt" ? "GPT (Codex)" : "Claude";
}

export function buildImplementationPrompt(
	provider: AgentProvider,
	featureId: string,
): string {
	if (provider === "gpt") {
		// Bug fix #1937: Add explicit autonomous execution instructions to prevent GPT from
		// asking clarifying questions (which causes stale heartbeats and workflow interruption).
		// GPT tends to read SKILL.md files that instruct it to ask questions before implementation.
		// Bug fix #2048: Add explicit status contract and git rules to prevent:
		//   - Writing non-standard statuses like "context_limit" or "blocked" (causes retry loops)
		//   - Using `git add -A` which deletes files on retry attempts
		return (
			"CRITICAL: This is an AUTONOMOUS execution with NO user interaction available. " +
			`You MUST NOT ask clarifying questions, wait for user input, or use any "brainstorming" skills. ` +
			"Make reasonable assumptions and proceed with implementation immediately.\n\n" +
			`Implement ALL tasks for feature ${featureId} using the Alpha workflow. ` +
			`Read and follow the instructions in ${WORKSPACE_DIR}/.claude/commands/alpha/implement.md exactly. ` +
			"Ensure you update .initiative-progress.json, update tasks.json statuses, run verification commands, " +
			"commit after each group, and exit cleanly at 60% context usage.\n\n" +
			"=== MANDATORY RULES ===\n" +
			'PROGRESS FILE STATUS: The ONLY valid values for "status" in .initiative-progress.json are: ' +
			'"in_progress", "completed", or "failed". NEVER write any other value (not "blocked", ' +
			'not "context_limit", not "partial", not "done"). ' +
			'When you finish all tasks, write status: "completed". ' +
			'When you reach 60% context usage and need to exit, write status: "completed" (NOT "context_limit"). ' +
			'When a task fails and you cannot continue, write status: "failed".\n\n' +
			"GIT OPERATIONS: NEVER use `git add -A` or `git add .`. " +
			"Always stage specific files: `git add <file1> <file2> ...`. " +
			"This prevents accidentally staging deletions or unrelated files on retry attempts.\n\n" +
			"VISUAL VERIFICATION: If a task requires agent-browser and it is not available, " +
			'skip that task and mark it as completed with a note. Do NOT mark tasks as "blocked".\n\n' +
			'HEARTBEAT TIMESTAMPS: When writing .initiative-progress.json, the "last_heartbeat" ' +
			'field MUST contain an actual ISO timestamp string (e.g., "2026-02-11T14:30:00+00:00"), ' +
			'NOT a shell expression like "$(date -Iseconds)". To get the current timestamp, run ' +
			"`date -Iseconds` in a shell command first, capture the output, then write it to the " +
			"JSON file. Example: TS=$(date -Iseconds) && jq --arg ts \"$TS\" '.last_heartbeat=$ts' " +
			".initiative-progress.json > /tmp/p.tmp && mv /tmp/p.tmp .initiative-progress.json"
		);
	}

	return `/alpha:implement ${featureId}`;
}

export function buildDocumentationPrompt(
	provider: AgentProvider,
	specId: string,
): string {
	if (provider === "gpt") {
		// Bug fix #1937: Add explicit autonomous execution instructions
		return (
			"CRITICAL: This is an AUTONOMOUS execution with NO user interaction available. " +
			"You MUST NOT ask clarifying questions or wait for user input. Proceed immediately.\n\n" +
			`Generate spec documentation for S${specId} using the Alpha workflow. ` +
			`Read and follow the instructions in ${WORKSPACE_DIR}/.claude/commands/alpha/document.md if present. ` +
			`If that file does not exist, mirror the behavior of /alpha:document ${specId} as closely as possible.`
		);
	}

	return `/alpha:document ${specId}`;
}

export function buildProviderCommand(
	provider: AgentProvider,
	prompt: string,
): string {
	const escapedPrompt = prompt.replace(/"/g, '\\"');
	if (provider === "gpt") {
		return `codex exec --full-auto --sandbox workspace-write "${escapedPrompt}"\nexit $?\n`;
	}

	return `run-claude "${escapedPrompt}"\nexit $?\n`;
}

export function buildDocumentationCommand(
	provider: AgentProvider,
	prompt: string,
): string {
	const escapedPrompt = prompt.replace(/"/g, '\\"');
	if (provider === "gpt") {
		return `codex exec --full-auto --sandbox workspace-write "${escapedPrompt}"`;
	}
	return `claude --dangerously-skip-permissions -p "${escapedPrompt}"`;
}

export function getGracefulShutdownCommand(provider: AgentProvider): string {
	if (provider === "gpt") {
		return "pkill -TERM -f 'codex' 2>/dev/null || true";
	}
	return "pkill -TERM run-claude 2>/dev/null || true";
}

export function getForceKillCommand(provider: AgentProvider): string {
	if (provider === "gpt") {
		return "pkill -9 -f 'codex' 2>/dev/null || true";
	}
	return "pkill -9 -f 'claude|run-claude' 2>/dev/null || true";
}

export function getProcessCountCommand(provider: AgentProvider): string {
	if (provider === "gpt") {
		return "pgrep -f 'codex' | wc -l";
	}
	return "pgrep -f 'claude|run-claude' | wc -l";
}
