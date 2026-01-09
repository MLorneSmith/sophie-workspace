/**

* Type definitions for the Alpha Spec Orchestrator
*
* This module contains all shared types and interfaces used across
* the orchestrator modules.
 */

import type { Sandbox } from "@e2b/code-interpreter";

// ============================================================================
// Feature & Initiative Types
// ============================================================================

export interface FeatureEntry {
	id: number;
	initiative_id: number;
	title: string;
	slug?: string;
	priority: number;
	global_priority: number;
	status: "pending" | "in_progress" | "completed" | "failed" | "blocked";
	tasks_file: string;
	feature_dir: string;
	task_count: number;
	tasks_completed: number;
	sequential_hours: number;
	parallel_hours: number;
	dependencies: number[];
	github_issue: number | null;
	assigned_sandbox?: string;
	error?: string;
	requires_database: boolean;
	database_task_count: number;
}

export interface InitiativeEntry {
	id: number;
	name: string;
	slug: string;
	priority: number;
	status: "pending" | "in_progress" | "completed" | "failed" | "partial";
	initiative_dir: string;
	feature_count: number;
	features_completed: number;
	dependencies: number[];
}

// ============================================================================
// Manifest Types
// ============================================================================

export interface SpecManifest {
	metadata: {
		spec_id: number;
		spec_name: string;
		generated_at: string;
		spec_dir: string;
		research_dir: string;
	};
	initiatives: InitiativeEntry[];
	feature_queue: FeatureEntry[];
	progress: {
		status: "pending" | "in_progress" | "completed" | "failed" | "partial";
		initiatives_completed: number;
		initiatives_total: number;
		features_completed: number;
		features_total: number;
		tasks_completed: number;
		tasks_total: number;
		next_feature_id: number | null;
		last_completed_feature_id: number | null;
		started_at: string | null;
		completed_at: string | null;
		last_checkpoint: string | null;
	};
	sandbox: {
		sandbox_ids: string[];
		branch_name: string | null;
		created_at: string | null;
	};
}

// ============================================================================
// Orchestrator Configuration Types
// ============================================================================

export interface OrchestratorOptions {
	specId: number;
	sandboxCount: number;
	timeout: number;
	dryRun: boolean;
	forceUnlock: boolean;
	skipDbReset: boolean;
	skipDbSeed: boolean;
	ui: boolean;
	minimalUi: boolean;
}

export interface OrchestratorLock {
	spec_id: number;
	started_at: string;
	pid: number;
	hostname: string;
	reset_in_progress?: boolean;
	reset_started_at?: string;
}

// ============================================================================
// Sandbox Types
// ============================================================================

export interface SandboxInstance {
	sandbox: Sandbox;
	id: string;
	label: string;
	status: "ready" | "busy" | "completed" | "failed";
	currentFeature: number | null;
	featureStartedAt?: Date;
	lastProgressSeen?: Date;
	lastHeartbeat?: Date;
	retryCount: number;
	claudeProcessId?: number;
}

export interface SandboxProgress {
	feature?: {
		issue_number: number;
		title: string;
	};
	current_task?: {
		id: string;
		name: string;
		status: string;
		started_at?: string;
		verification_attempts?: number;
	};
	completed_tasks?: string[];
	failed_tasks?: string[];
	current_group?: {
		id: number;
		name: string;
		tasks_total: number;
		tasks_completed: number;
	};
	context_usage_percent?: number;
	status?: string;
	last_commit?: string;
	last_heartbeat?: string;
	last_tool?: string;
	phase?: string;
}

// ============================================================================
// Health Check Types
// ============================================================================

export interface HealthCheckResult {
	healthy: boolean;
	issue?: "no_progress_file" | "stale_heartbeat" | "high_resource_no_progress";
	message?: string;
	timeSinceStart?: number;
	timeSinceProgress?: number;
	timeSinceHeartbeat?: number;
}

// ============================================================================
// UI Manager Types
// ============================================================================

export interface UIManager {
	start: (onExit?: () => void) => void;
	stop: () => void;
	getState: () => unknown;
	waitForExit: () => Promise<void>;
}

// ============================================================================
// Feature Implementation Result
// ============================================================================

export interface FeatureImplementationResult {
	success: boolean;
	tasksCompleted: number;
	error?: string;
}

// ============================================================================
// Review URL Types
// ============================================================================

export interface ReviewUrl {
	label: string;
	vscode: string;
	devServer: string;
}
