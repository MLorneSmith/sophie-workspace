import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  UIState,
  SandboxState,
  OrchestratorEvent,
  OverallProgress,
  SandboxProgressFile,
  Phase,
  TaskInfo,
  GroupInfo,
} from '../types.js';
import {
  POLL_INTERVAL_MS,
  HEARTBEAT_STALL_THRESHOLD_MS,
} from '../types.js';

/**
 * Configuration for the progress poller
 */
export interface ProgressPollerConfig {
  /** Spec ID being orchestrated */
  specId: number;
  /** Spec name for display */
  specName: string;
  /** Directory containing sandbox progress files */
  progressDir: string;
  /** Sandbox labels to monitor */
  sandboxLabels: string[];
  /** Polling interval in ms (default: 15000) */
  pollInterval?: number;
  /** Callback when state changes */
  onStateChange?: (state: UIState) => void;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
}

/**
 * Result of reading a progress file
 */
interface ProgressFileResult {
  label: string;
  data: SandboxProgressFile | null;
  error: string | null;
}

/**
 * Sandbox progress reader interface (injected for testability)
 */
export interface ProgressReader {
  readProgressFile: (
    label: string,
    progressDir: string
  ) => Promise<ProgressFileResult>;
}

/**
 * Default progress reader using fs
 */
export const createFsProgressReader = (): ProgressReader => {
  return {
    readProgressFile: async (
      label: string,
      progressDir: string
    ): Promise<ProgressFileResult> => {
      try {
        // Dynamic import to work in both Node and browser contexts
        const fs = await import('fs/promises');
        const path = await import('path');

        const filePath = path.join(progressDir, `${label}-progress.json`);
        const content = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(content) as SandboxProgressFile;

        return { label, data, error: null };
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        return { label, data: null, error };
      }
    },
  };
};

/**
 * Map task status from progress file to TaskInfo status
 */
function mapTaskStatus(
  status: string
): 'starting' | 'in_progress' | 'completed' | 'failed' | 'blocked' {
  switch (status) {
    case 'pending':
      return 'starting';
    case 'in_progress':
      return 'in_progress';
    case 'completed':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'blocked':
      return 'blocked';
    default:
      return 'starting';
  }
}

/**
 * Convert progress file data to sandbox state
 */
function progressToSandboxState(
  label: string,
  sandboxId: string,
  progress: SandboxProgressFile | null,
  previousState: SandboxState | undefined
): SandboxState {
  if (!progress) {
    // No progress file yet - sandbox may be initializing
    return {
      sandboxId,
      label,
      status: 'ready',
      currentFeature: null,
      currentTask: null,
      currentGroup: null,
      tasksCompleted: 0,
      tasksTotal: 0,
      phase: 'idle',
      contextUsage: 0,
      lastHeartbeat: previousState?.lastHeartbeat ?? null,
      lastTool: null,
      toolCount: 0,
      retryCount: 0,
      error: undefined,
    };
  }

  // Parse heartbeat timestamp
  let lastHeartbeat: Date | null = null;
  if (progress.last_heartbeat) {
    lastHeartbeat = new Date(progress.last_heartbeat);
  }

  // Determine status from progress data
  let status: SandboxState['status'] = 'busy';
  if (progress.status === 'completed') {
    status = 'completed';
  } else if (progress.status === 'failed') {
    status = 'failed';
  } else if (!progress.feature) {
    status = 'ready';
  }

  // Map current feature
  const currentFeature = progress.feature
    ? {
        id: progress.feature.issue_number,
        title: progress.feature.title,
      }
    : null;

  // Map current task
  let currentTask: TaskInfo | null = null;
  if (progress.current_task) {
    currentTask = {
      id: progress.current_task.id,
      name: progress.current_task.name,
      status: mapTaskStatus(progress.current_task.status),
      verificationAttempts: progress.current_task.verification_attempts,
      startedAt: progress.current_task.started_at
        ? new Date(progress.current_task.started_at)
        : undefined,
    };
  }

  // Map current group
  let currentGroup: GroupInfo | null = null;
  if (progress.current_group) {
    currentGroup = {
      id: progress.current_group.id,
      name: progress.current_group.name,
      tasksTotal: progress.current_group.tasks_total,
      tasksCompleted: progress.current_group.tasks_completed,
    };
  }

  // Calculate tasks completed/total
  const tasksCompleted = progress.completed_tasks?.length ?? 0;
  const tasksTotal =
    tasksCompleted + (progress.failed_tasks?.length ?? 0) + (progress.current_task ? 1 : 0);

  return {
    sandboxId,
    label,
    status,
    currentFeature,
    currentTask,
    currentGroup,
    tasksCompleted,
    tasksTotal: tasksTotal > 0 ? tasksTotal : (previousState?.tasksTotal ?? 0),
    phase: (progress.phase as Phase) ?? 'idle',
    contextUsage: progress.context_usage_percent ?? 0,
    lastHeartbeat,
    lastTool: progress.last_tool ?? null,
    toolCount: progress.tool_count ?? 0,
    retryCount: previousState?.retryCount ?? 0,
    error: undefined,
    lastCommit: progress.last_commit,
  };
}

/**
 * Aggregate sandbox states into overall progress
 */
function aggregateProgress(
  specId: number,
  specName: string,
  sandboxes: Map<string, SandboxState>,
  previousProgress: OverallProgress | null
): OverallProgress {
  let featuresTotal = 0;
  let featuresCompleted = 0;
  let tasksTotal = 0;
  let tasksCompleted = 0;
  let activeFeatures = 0;

  // Count unique features across all sandboxes
  const seenFeatures = new Set<number>();

  for (const sandbox of sandboxes.values()) {
    if (sandbox.currentFeature && !seenFeatures.has(sandbox.currentFeature.id)) {
      seenFeatures.add(sandbox.currentFeature.id);
      if (sandbox.status === 'completed') {
        featuresCompleted++;
      } else {
        activeFeatures++;
      }
    }

    tasksTotal += sandbox.tasksTotal;
    tasksCompleted += sandbox.tasksCompleted;
  }

  // Use previous totals if we haven't discovered all features yet
  if (previousProgress && previousProgress.featuresTotal > seenFeatures.size) {
    featuresTotal = previousProgress.featuresTotal;
  } else {
    featuresTotal = seenFeatures.size;
  }

  // Determine overall status
  let status: OverallProgress['status'] = 'in_progress';
  const allCompleted = Array.from(sandboxes.values()).every(
    (s) => s.status === 'completed' || s.status === 'ready'
  );
  const anyFailed = Array.from(sandboxes.values()).some(
    (s) => s.status === 'failed'
  );

  if (anyFailed) {
    status = 'failed';
  } else if (allCompleted && featuresCompleted === featuresTotal && featuresTotal > 0) {
    status = 'completed';
  } else if (activeFeatures === 0 && featuresCompleted === 0) {
    status = 'pending';
  }

  return {
    specId,
    specName,
    status,
    initiativesTotal: 1, // Specs have one initiative by design
    initiativesCompleted: status === 'completed' ? 1 : 0,
    featuresTotal,
    featuresCompleted,
    tasksTotal,
    tasksCompleted,
  };
}

/**
 * Generate events from state changes
 */
function generateEvents(
  previousState: UIState | null,
  newState: UIState
): OrchestratorEvent[] {
  const events: OrchestratorEvent[] = [];
  const now = new Date();

  if (!previousState) {
    // Initial event - use first sandbox label or 'system'
    const firstLabel = Array.from(newState.sandboxes.keys())[0] ?? 'sbx-a';
    events.push({
      id: `init-${now.getTime()}`,
      timestamp: now,
      type: 'feature_start',
      sandboxLabel: firstLabel,
      message: `Spec #${newState.overallProgress.specId} started`,
    });
    return events;
  }

  // Check each sandbox for changes
  for (const [label, sandbox] of newState.sandboxes) {
    const prevSandbox = previousState.sandboxes.get(label);

    // New sandbox
    if (!prevSandbox) {
      events.push({
        id: `sandbox-new-${label}-${now.getTime()}`,
        timestamp: now,
        type: 'feature_start',
        sandboxLabel: label,
        message: `Sandbox ${label} started`,
      });
      continue;
    }

    // Feature started
    if (
      sandbox.currentFeature &&
      (!prevSandbox.currentFeature ||
        sandbox.currentFeature.id !== prevSandbox.currentFeature.id)
    ) {
      events.push({
        id: `feature-start-${sandbox.currentFeature.id}-${now.getTime()}`,
        timestamp: now,
        type: 'feature_start',
        sandboxLabel: label,
        message: `Feature #${sandbox.currentFeature.id} started on ${label}`,
        details: { featureId: sandbox.currentFeature.id },
      });
    }

    // Task started
    if (
      sandbox.currentTask &&
      (!prevSandbox.currentTask ||
        sandbox.currentTask.id !== prevSandbox.currentTask.id)
    ) {
      events.push({
        id: `task-start-${sandbox.currentTask.id}-${now.getTime()}`,
        timestamp: now,
        type: 'task_start',
        sandboxLabel: label,
        message: `Task ${sandbox.currentTask.id} started`,
        details: { taskId: sandbox.currentTask.id },
      });
    }

    // Task completed
    if (
      prevSandbox.currentTask &&
      sandbox.currentTask &&
      prevSandbox.currentTask.id === sandbox.currentTask.id &&
      prevSandbox.currentTask.status === 'in_progress' &&
      sandbox.currentTask.status === 'completed'
    ) {
      events.push({
        id: `task-done-${sandbox.currentTask.id}-${now.getTime()}`,
        timestamp: now,
        type: 'task_complete',
        sandboxLabel: label,
        message: `Task ${sandbox.currentTask.id} completed`,
        details: { taskId: sandbox.currentTask.id },
      });
    }

    // Feature completed (status changed to completed)
    if (prevSandbox.status === 'busy' && sandbox.status === 'completed') {
      events.push({
        id: `feature-done-${label}-${now.getTime()}`,
        timestamp: now,
        type: 'feature_complete',
        sandboxLabel: label,
        message: `Feature completed on ${label}`,
        details: { featureId: sandbox.currentFeature?.id },
      });
    }

    // Stall detected
    if (sandbox.lastHeartbeat) {
      const heartbeatAge = now.getTime() - sandbox.lastHeartbeat.getTime();
      const prevAge = prevSandbox.lastHeartbeat
        ? now.getTime() - prevSandbox.lastHeartbeat.getTime()
        : 0;

      if (
        heartbeatAge > HEARTBEAT_STALL_THRESHOLD_MS &&
        prevAge <= HEARTBEAT_STALL_THRESHOLD_MS
      ) {
        events.push({
          id: `stall-${label}-${now.getTime()}`,
          timestamp: now,
          type: 'stall_detected',
          sandboxLabel: label,
          message: `Stall detected on ${label}`,
        });
      }
    }

    // Error occurred
    if (sandbox.error && sandbox.error !== prevSandbox.error) {
      events.push({
        id: `error-${label}-${now.getTime()}`,
        timestamp: now,
        type: 'error',
        sandboxLabel: label,
        message: sandbox.error,
      });
    }
  }

  // Spec completed
  if (
    previousState.overallProgress.status === 'in_progress' &&
    newState.overallProgress.status === 'completed'
  ) {
    const firstLabel = Array.from(newState.sandboxes.keys())[0] ?? 'sbx-a';
    events.push({
      id: `spec-done-${now.getTime()}`,
      timestamp: now,
      type: 'feature_complete',
      sandboxLabel: firstLabel,
      message: `Spec #${newState.overallProgress.specId} completed!`,
    });
  }

  return events;
}

/**
 * Custom hook for polling sandbox progress files
 *
 * Polls progress files at regular intervals and maintains
 * orchestrator state with sandbox statuses, overall progress,
 * and event log.
 */
export function useProgressPoller(
  config: ProgressPollerConfig,
  reader: ProgressReader = createFsProgressReader()
): {
  state: UIState;
  isPolling: boolean;
  lastPollTime: Date | null;
  error: Error | null;
  startPolling: () => void;
  stopPolling: () => void;
  pollNow: () => Promise<void>;
} {
  const {
    specId,
    specName,
    progressDir,
    sandboxLabels,
    pollInterval = POLL_INTERVAL_MS,
    onStateChange,
    onError,
  } = config;

  // State
  const [state, setState] = useState<UIState>(() => ({
    sandboxes: new Map(),
    overallProgress: {
      specId,
      specName,
      status: 'pending',
      initiativesTotal: 1,
      initiativesCompleted: 0,
      featuresTotal: 0,
      featuresCompleted: 0,
      tasksTotal: 0,
      tasksCompleted: 0,
    },
    events: [],
    sessionStartTime: new Date(),
    uiMode: 'dashboard',
  }));

  const [isPolling, setIsPolling] = useState(false);
  const [lastPollTime, setLastPollTime] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Refs for interval management
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousStateRef = useRef<UIState | null>(null);
  const sandboxIdsRef = useRef<Map<string, string>>(new Map());

  /**
   * Perform a single poll of all sandbox progress files
   */
  const pollNow = useCallback(async () => {
    try {
      // Read all progress files in parallel
      const results = await Promise.all(
        sandboxLabels.map((label) => reader.readProgressFile(label, progressDir))
      );

      // Build new sandbox states
      const newSandboxes = new Map<string, SandboxState>();

      for (const result of results) {
        // Get or generate sandbox ID
        let sandboxId = sandboxIdsRef.current.get(result.label);
        if (!sandboxId) {
          sandboxId = result.data?.session_id ?? `${result.label}-${Date.now()}`;
          sandboxIdsRef.current.set(result.label, sandboxId);
        }

        const previousSandbox = previousStateRef.current?.sandboxes.get(
          result.label
        );

        const sandboxState = progressToSandboxState(
          result.label,
          sandboxId,
          result.data,
          previousSandbox
        );

        newSandboxes.set(result.label, sandboxState);
      }

      // Aggregate overall progress
      const newProgress = aggregateProgress(
        specId,
        specName,
        newSandboxes,
        previousStateRef.current?.overallProgress ?? null
      );

      // Generate events from state changes
      const newEvents = generateEvents(previousStateRef.current, {
        sandboxes: newSandboxes,
        overallProgress: newProgress,
        events: [],
        sessionStartTime: state.sessionStartTime,
        uiMode: 'dashboard',
      });

      // Build new state
      const newState: UIState = {
        sandboxes: newSandboxes,
        overallProgress: newProgress,
        events: [
          ...newEvents,
          ...(previousStateRef.current?.events ?? []),
        ].slice(0, 100), // Keep last 100 events
        sessionStartTime: state.sessionStartTime,
        uiMode: 'dashboard',
      };

      // Update state
      setState(newState);
      previousStateRef.current = newState;
      setLastPollTime(new Date());
      setError(null);

      // Callback
      onStateChange?.(newState);
    } catch (err) {
      const pollError =
        err instanceof Error ? err : new Error(String(err));
      setError(pollError);
      onError?.(pollError);
    }
  }, [
    sandboxLabels,
    progressDir,
    reader,
    specId,
    specName,
    state.sessionStartTime,
    onStateChange,
    onError,
  ]);

  /**
   * Start polling at regular intervals
   */
  const startPolling = useCallback(() => {
    if (intervalRef.current) return; // Already polling

    setIsPolling(true);
    pollNow(); // Poll immediately

    intervalRef.current = setInterval(() => {
      pollNow();
    }, pollInterval);
  }, [pollNow, pollInterval]);

  /**
   * Stop polling
   */
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    state,
    isPolling,
    lastPollTime,
    error,
    startPolling,
    stopPolling,
    pollNow,
  };
}

/**
 * Create initial UI state
 */
export function createInitialState(
  specId: number,
  specName: string
): UIState {
  return {
    sandboxes: new Map(),
    overallProgress: {
      specId,
      specName,
      status: 'pending',
      initiativesTotal: 1,
      initiativesCompleted: 0,
      featuresTotal: 0,
      featuresCompleted: 0,
      tasksTotal: 0,
      tasksCompleted: 0,
    },
    events: [],
    sessionStartTime: new Date(),
    uiMode: 'dashboard',
  };
}
