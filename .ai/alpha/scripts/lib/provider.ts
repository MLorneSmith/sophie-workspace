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
		return (
			`Implement ALL tasks for feature ${featureId} using the Alpha workflow. ` +
			`Read and follow the instructions in ${WORKSPACE_DIR}/.claude/commands/alpha/implement.md exactly. ` +
			`Ensure you update .initiative-progress.json, update tasks.json statuses, run verification commands, ` +
			`commit after each group, and exit cleanly at 60% context usage.`
		);
	}

	return `/alpha:implement ${featureId}`;
}

export function buildDocumentationPrompt(
	provider: AgentProvider,
	specId: string,
): string {
	if (provider === "gpt") {
		return (
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
