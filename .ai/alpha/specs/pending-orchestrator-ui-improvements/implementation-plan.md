# Implementation Plan: Orchestrator UI & Progress Reporting Improvements

**Feature**: Persistent Dashboard UI + Enhanced Progress Reporting for Alpha Spec Orchestrator
**Date**: 2026-01-08
**Estimated Total Hours**: 18-24 hours (sequential) / 12-16 hours (parallel)

## Overview

Transform the Alpha Spec Orchestrator from streaming line-by-line output to a persistent 3-column dashboard with enhanced progress reporting via Claude Code hooks.

### Goals

1. **Persistent 3-Column UI**: Real-time dashboard showing all sandbox states
2. **Reliable Heartbeats**: PostToolUse hooks for guaranteed activity signals
3. **Faster Stall Detection**: Reduce detection time from 10 minutes to ~2 minutes
4. **Overall Progress Visibility**: Show spec-level completion percentage
5. **Backward Compatibility**: `--ui-mode=streaming` preserves current behavior

---

## Phase 1: Foundation Setup

### T1: Add Ink Dependencies and Project Structure

**Priority**: 1 (Critical Path)
**Estimated Hours**: 1h
**Blocked By**: None

**Action**: Create UI package structure and add dependencies

**Files to Create/Modify**:
```
.ai/alpha/scripts/ui/
├── package.json          (NEW)
├── tsconfig.json         (NEW)
└── types.ts              (NEW)
```

**Implementation**:

1. Create `ui/package.json`:
```json
{
  "name": "@slideheroes/orchestrator-ui",
  "version": "1.0.0",
  "type": "module",
  "main": "index.tsx",
  "dependencies": {
    "ink": "^5.1.0",
    "ink-spinner": "^5.0.0",
    "react": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0"
  }
}
```

2. Create `ui/tsconfig.json`:
```json
{
  "extends": "../../../../tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022"
  },
  "include": ["*.tsx", "**/*.tsx", "**/*.ts"]
}
```

3. Create `ui/types.ts` with all UI interfaces (see detailed types below)

**Verification Command**:
```bash
cd .ai/alpha/scripts/ui && pnpm install && pnpm tsc --noEmit
```

**Acceptance Criterion**: Dependencies install and TypeScript compiles without errors

---

### T2: Define UI Type System

**Priority**: 1 (Critical Path)
**Estimated Hours**: 1h
**Blocked By**: T1

**Action**: Create comprehensive type definitions for UI state

**Files to Create**:
- `.ai/alpha/scripts/ui/types.ts`

**Implementation**:

```typescript
// types.ts - UI State Types

export type HealthStatus = 'running' | 'warning' | 'stalled' | 'idle' | 'completed' | 'failed';

export type Phase =
  | 'idle'
  | 'loading_context'
  | 'loading_research'
  | 'loading_docs'
  | 'analyzing_parallelism'
  | 'executing'
  | 'verifying'
  | 'committing'
  | 'pushing'
  | 'completed'
  | 'failed';

export interface FeatureInfo {
  id: number;
  title: string;
}

export interface TaskInfo {
  id: string;
  name: string;
  status: 'starting' | 'in_progress' | 'completed' | 'failed';
  verificationAttempts?: number;
}

export interface GroupInfo {
  id: number;
  name: string;
  tasksTotal: number;
  tasksCompleted: number;
}

export interface SandboxState {
  sandboxId: string;
  label: string;
  status: 'ready' | 'busy' | 'completed' | 'failed';
  currentFeature: FeatureInfo | null;
  currentTask: TaskInfo | null;
  currentGroup: GroupInfo | null;
  phase: Phase;
  tasksCompleted: number;
  tasksTotal: number;
  contextUsage: number;
  lastHeartbeat: Date | null;
  lastTool: string | null;
  toolCount: number;
  retryCount: number;
  error?: string;
}

export interface OverallProgress {
  specId: number;
  specName: string;
  initiativesCompleted: number;
  initiativesTotal: number;
  featuresCompleted: number;
  featuresTotal: number;
  tasksCompleted: number;
  tasksTotal: number;
  status: 'pending' | 'in_progress' | 'completed' | 'partial' | 'failed';
}

export interface OrchestratorEvent {
  id: string;
  timestamp: Date;
  type: 'task_start' | 'task_complete' | 'feature_complete' | 'commit' | 'push' | 'error' | 'health_warning' | 'stall_detected';
  sandboxLabel: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface UIState {
  sandboxes: Map<string, SandboxState>;
  overallProgress: OverallProgress;
  events: OrchestratorEvent[];
  sessionStartTime: Date;
  uiMode: 'dashboard' | 'streaming';
}

// Progress file format (from sandbox)
export interface SandboxProgressFile {
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
  current_group?: {
    id: number;
    name: string;
    tasks_total: number;
    tasks_completed: number;
  };
  completed_tasks?: string[];
  failed_tasks?: string[];
  context_usage_percent?: number;
  status?: string;
  phase?: string;
  last_heartbeat?: string;
  last_tool?: string;
  tool_count?: number;
  last_commit?: string;
}
```

**Verification Command**:
```bash
cd .ai/alpha/scripts/ui && pnpm tsc types.ts --noEmit
```

**Acceptance Criterion**: Types compile without errors and cover all UI state requirements

---

## Phase 2: Core UI Components

### T3: Create ProgressBar Component

**Priority**: 2
**Estimated Hours**: 0.5h
**Blocked By**: T1, T2

**Action**: Create reusable progress bar component

**Files to Create**:
- `.ai/alpha/scripts/ui/components/ProgressBar.tsx`

**Implementation**:

```typescript
import React from 'react';
import { Box, Text } from 'ink';

export interface ProgressBarProps {
  current: number;
  total: number;
  width?: number;
  showPercentage?: boolean;
  showCount?: boolean;
  filledChar?: string;
  emptyChar?: string;
  filledColor?: string;
  emptyColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  width = 20,
  showPercentage = true,
  showCount = true,
  filledChar = '█',
  emptyChar = '░',
  filledColor = 'green',
  emptyColor = 'gray',
}) => {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  const filledWidth = Math.round((percent / 100) * width);
  const emptyWidth = width - filledWidth;

  return (
    <Box>
      <Text>[</Text>
      <Text color={filledColor}>{filledChar.repeat(filledWidth)}</Text>
      <Text color={emptyColor}>{emptyChar.repeat(emptyWidth)}</Text>
      <Text>]</Text>
      {showCount && <Text> {current}/{total}</Text>}
      {showPercentage && <Text> ({percent}%)</Text>}
    </Box>
  );
};
```

**Verification Command**:
```bash
cd .ai/alpha/scripts/ui && pnpm tsc components/ProgressBar.tsx --noEmit
```

**Acceptance Criterion**: Component renders progress bar with correct proportions

---

### T4: Create Header Component

**Priority**: 2
**Estimated Hours**: 0.5h
**Blocked By**: T1, T2

**Action**: Create header showing spec info and elapsed time

**Files to Create**:
- `.ai/alpha/scripts/ui/components/Header.tsx`

**Implementation**:

```typescript
import React from 'react';
import { Box, Text } from 'ink';
import type { OverallProgress } from '../types.js';

export interface HeaderProps {
  progress: OverallProgress;
  sessionStartTime: Date;
}

export const Header: React.FC<HeaderProps> = ({ progress, sessionStartTime }) => {
  const elapsed = Math.round((Date.now() - sessionStartTime.getTime()) / 60000);
  const hours = Math.floor(elapsed / 60);
  const minutes = elapsed % 60;
  const elapsedStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  const statusColor = {
    pending: 'gray',
    in_progress: 'cyan',
    completed: 'green',
    partial: 'yellow',
    failed: 'red',
  }[progress.status];

  return (
    <Box
      flexDirection="column"
      borderStyle="double"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
    >
      <Box justifyContent="space-between">
        <Text bold color="cyan">
          ALPHA ORCHESTRATOR - Spec #{progress.specId}
        </Text>
        <Text color={statusColor}>{progress.status.toUpperCase()}</Text>
      </Box>
      <Box justifyContent="space-between">
        <Text>{progress.specName}</Text>
        <Text dimColor>Elapsed: {elapsedStr}</Text>
      </Box>
    </Box>
  );
};
```

**Verification Command**:
```bash
cd .ai/alpha/scripts/ui && pnpm tsc components/Header.tsx --noEmit
```

**Acceptance Criterion**: Header displays spec info and dynamically updates elapsed time

---

### T5: Create SandboxColumn Component

**Priority**: 2
**Estimated Hours**: 2h
**Blocked By**: T2, T3

**Action**: Create per-sandbox column showing all metrics

**Files to Create**:
- `.ai/alpha/scripts/ui/components/SandboxColumn.tsx`

**Implementation**:

```typescript
import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { ProgressBar } from './ProgressBar.js';
import type { SandboxState, HealthStatus } from '../types.js';

export interface SandboxColumnProps {
  state: SandboxState;
}

const STATUS_ICONS: Record<HealthStatus, string> = {
  running: '🟢',
  warning: '🟡',
  stalled: '🔴',
  idle: '⚪',
  completed: '✅',
  failed: '❌',
};

const BORDER_COLORS: Record<HealthStatus, string> = {
  running: 'green',
  warning: 'yellow',
  stalled: 'red',
  idle: 'gray',
  completed: 'green',
  failed: 'red',
};

export const SandboxColumn: React.FC<SandboxColumnProps> = ({ state }) => {
  const healthStatus = computeHealthStatus(state);
  const heartbeatAge = state.lastHeartbeat
    ? Math.round((Date.now() - state.lastHeartbeat.getTime()) / 1000)
    : null;

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={BORDER_COLORS[healthStatus]}
      paddingX={1}
      width="33%"
      minWidth={30}
    >
      {/* Header */}
      <Box justifyContent="space-between">
        <Text bold color="cyan">{state.label}</Text>
        <Text>{STATUS_ICONS[healthStatus]}</Text>
      </Box>
      <Text dimColor>ID: {state.sandboxId.substring(0, 10)}</Text>

      {/* Current Feature */}
      {state.currentFeature ? (
        <Box flexDirection="column" marginTop={1}>
          <Text color="yellow">#{state.currentFeature.id}</Text>
          <Text>{truncate(state.currentFeature.title, 28)}</Text>
          <ProgressBar
            current={state.tasksCompleted}
            total={state.tasksTotal}
            width={18}
          />
        </Box>
      ) : (
        <Box marginTop={1}>
          <Text dimColor>
            {state.status === 'completed' ? 'All work done' : 'Waiting for work...'}
          </Text>
        </Box>
      )}

      {/* Current Task */}
      {state.currentTask && (
        <Box flexDirection="column" marginTop={1}>
          <Box>
            {state.currentTask.status === 'in_progress' && (
              <Text color="green"><Spinner type="dots" /> </Text>
            )}
            <Text color="yellow">{state.currentTask.id}</Text>
          </Box>
          <Text>{truncate(state.currentTask.name, 26)}</Text>
          {state.currentTask.verificationAttempts && state.currentTask.verificationAttempts > 1 && (
            <Text color="yellow">Retry {state.currentTask.verificationAttempts}</Text>
          )}
        </Box>
      )}

      {/* Phase */}
      <Box marginTop={1}>
        <Text dimColor>Phase: </Text>
        <Text>{formatPhase(state.phase)}</Text>
      </Box>

      {/* Context Usage */}
      <Box>
        <Text dimColor>Context: </Text>
        <Text color={getContextColor(state.contextUsage)}>
          {state.contextUsage}%
        </Text>
      </Box>

      {/* Heartbeat */}
      {heartbeatAge !== null && (
        <Box>
          <Text dimColor>💓 </Text>
          <Text color={getHeartbeatColor(heartbeatAge)}>
            {formatHeartbeatAge(heartbeatAge)}
          </Text>
        </Box>
      )}

      {/* Error */}
      {state.error && (
        <Box marginTop={1}>
          <Text color="red">{truncate(state.error, 28)}</Text>
        </Box>
      )}
    </Box>
  );
};

// Helper functions
function computeHealthStatus(state: SandboxState): HealthStatus {
  if (state.status === 'completed') return 'completed';
  if (state.status === 'failed') return 'failed';
  if (!state.currentFeature) return 'idle';
  if (!state.lastHeartbeat) return 'warning';

  const heartbeatAge = Date.now() - state.lastHeartbeat.getTime();
  if (heartbeatAge > 5 * 60 * 1000) return 'stalled';  // 5 minutes
  if (heartbeatAge > 2 * 60 * 1000) return 'warning';  // 2 minutes

  return 'running';
}

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.substring(0, maxLen - 3) + '...' : str;
}

function formatPhase(phase: string): string {
  return phase.replace(/_/g, ' ');
}

function getContextColor(percent: number): string {
  if (percent > 70) return 'red';
  if (percent > 50) return 'yellow';
  return 'green';
}

function getHeartbeatColor(ageSeconds: number): string {
  if (ageSeconds > 300) return 'red';
  if (ageSeconds > 120) return 'yellow';
  return 'green';
}

function formatHeartbeatAge(ageSeconds: number): string {
  if (ageSeconds < 60) return `${ageSeconds}s ago`;
  const minutes = Math.floor(ageSeconds / 60);
  const seconds = ageSeconds % 60;
  return `${minutes}m ${seconds}s ago`;
}
```

**Verification Command**:
```bash
cd .ai/alpha/scripts/ui && pnpm tsc components/SandboxColumn.tsx --noEmit
```

**Acceptance Criterion**: Column displays all sandbox metrics with correct health status computation

---

### T6: Create SandboxGrid Component

**Priority**: 2
**Estimated Hours**: 0.5h
**Blocked By**: T5

**Action**: Create 3-column layout manager

**Files to Create**:
- `.ai/alpha/scripts/ui/components/SandboxGrid.tsx`

**Implementation**:

```typescript
import React from 'react';
import { Box } from 'ink';
import { SandboxColumn } from './SandboxColumn.js';
import type { SandboxState } from '../types.js';

export interface SandboxGridProps {
  sandboxes: Map<string, SandboxState>;
}

export const SandboxGrid: React.FC<SandboxGridProps> = ({ sandboxes }) => {
  const labels = ['sbx-a', 'sbx-b', 'sbx-c'];

  return (
    <Box justifyContent="space-between" marginY={1}>
      {labels.map((label) => {
        const state = sandboxes.get(label);
        if (!state) return null;

        return <SandboxColumn key={label} state={state} />;
      })}
    </Box>
  );
};
```

**Verification Command**:
```bash
cd .ai/alpha/scripts/ui && pnpm tsc components/SandboxGrid.tsx --noEmit
```

**Acceptance Criterion**: Grid renders 1-3 columns based on sandbox count

---

### T7: Create OverallProgress Component

**Priority**: 2
**Estimated Hours**: 0.5h
**Blocked By**: T3

**Action**: Create overall spec progress display

**Files to Create**:
- `.ai/alpha/scripts/ui/components/OverallProgress.tsx`

**Implementation**:

```typescript
import React from 'react';
import { Box, Text } from 'ink';
import { ProgressBar } from './ProgressBar.js';
import type { OverallProgress as OverallProgressType } from '../types.js';

export interface OverallProgressProps {
  progress: OverallProgressType;
}

export const OverallProgress: React.FC<OverallProgressProps> = ({ progress }) => {
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="gray"
      paddingX={2}
      marginY={1}
    >
      <Text bold>Overall Progress</Text>

      <Box marginTop={1}>
        <Box width={12}>
          <Text>Initiatives:</Text>
        </Box>
        <ProgressBar
          current={progress.initiativesCompleted}
          total={progress.initiativesTotal}
          width={25}
          filledColor="magenta"
        />
      </Box>

      <Box>
        <Box width={12}>
          <Text>Features:</Text>
        </Box>
        <ProgressBar
          current={progress.featuresCompleted}
          total={progress.featuresTotal}
          width={25}
          filledColor="cyan"
        />
      </Box>

      <Box>
        <Box width={12}>
          <Text>Tasks:</Text>
        </Box>
        <ProgressBar
          current={progress.tasksCompleted}
          total={progress.tasksTotal}
          width={25}
          filledColor="green"
        />
      </Box>
    </Box>
  );
};
```

**Verification Command**:
```bash
cd .ai/alpha/scripts/ui && pnpm tsc components/OverallProgress.tsx --noEmit
```

**Acceptance Criterion**: Component displays 3 progress bars for initiatives, features, and tasks

---

### T8: Create EventLog Component

**Priority**: 2
**Estimated Hours**: 1h
**Blocked By**: T2

**Action**: Create scrollable event log feed

**Files to Create**:
- `.ai/alpha/scripts/ui/components/EventLog.tsx`

**Implementation**:

```typescript
import React from 'react';
import { Box, Text } from 'ink';
import type { OrchestratorEvent } from '../types.js';

export interface EventLogProps {
  events: OrchestratorEvent[];
  maxEvents?: number;
}

const EVENT_ICONS: Record<OrchestratorEvent['type'], string> = {
  task_start: '▶️',
  task_complete: '✅',
  feature_complete: '🎉',
  commit: '📝',
  push: '🚀',
  error: '❌',
  health_warning: '⚠️',
  stall_detected: '🔴',
};

const EVENT_COLORS: Record<OrchestratorEvent['type'], string> = {
  task_start: 'blue',
  task_complete: 'green',
  feature_complete: 'magenta',
  commit: 'cyan',
  push: 'cyan',
  error: 'red',
  health_warning: 'yellow',
  stall_detected: 'red',
};

export const EventLog: React.FC<EventLogProps> = ({ events, maxEvents = 8 }) => {
  const recentEvents = events.slice(-maxEvents);

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
    >
      <Text bold>Recent Events</Text>
      {recentEvents.length === 0 ? (
        <Text dimColor>No events yet...</Text>
      ) : (
        recentEvents.map((event) => (
          <Box key={event.id}>
            <Text dimColor>
              {event.timestamp.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </Text>
            <Text> [{event.sandboxLabel}] </Text>
            <Text>{EVENT_ICONS[event.type]} </Text>
            <Text color={EVENT_COLORS[event.type]}>{event.message}</Text>
          </Box>
        ))
      )}
    </Box>
  );
};
```

**Verification Command**:
```bash
cd .ai/alpha/scripts/ui && pnpm tsc components/EventLog.tsx --noEmit
```

**Acceptance Criterion**: Event log shows recent events with proper color-coding

---

### T9: Create Root OrchestratorUI Component

**Priority**: 2
**Estimated Hours**: 1h
**Blocked By**: T4, T6, T7, T8

**Action**: Create root UI component that combines all sections

**Files to Create**:
- `.ai/alpha/scripts/ui/components/OrchestratorUI.tsx`

**Implementation**:

```typescript
import React from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { Header } from './Header.js';
import { SandboxGrid } from './SandboxGrid.js';
import { OverallProgress } from './OverallProgress.js';
import { EventLog } from './EventLog.js';
import type { UIState } from '../types.js';

export interface OrchestratorUIProps {
  state: UIState;
}

export const OrchestratorUI: React.FC<OrchestratorUIProps> = ({ state }) => {
  const { exit } = useApp();

  // Keyboard shortcuts
  useInput((input, key) => {
    if (input === 'q' || (key.ctrl && input === 'c')) {
      exit();
    }
  });

  return (
    <Box flexDirection="column">
      <Header
        progress={state.overallProgress}
        sessionStartTime={state.sessionStartTime}
      />

      <SandboxGrid sandboxes={state.sandboxes} />

      <OverallProgress progress={state.overallProgress} />

      <EventLog events={state.events} />

      <Box marginTop={1}>
        <Text dimColor>Press 'q' to exit</Text>
      </Box>
    </Box>
  );
};
```

**Verification Command**:
```bash
cd .ai/alpha/scripts/ui && pnpm tsc components/OrchestratorUI.tsx --noEmit
```

**Acceptance Criterion**: Root component renders all sections in correct layout

---

## Phase 3: State Management & Polling

### T10: Create Progress Polling Hook

**Priority**: 3
**Estimated Hours**: 2h
**Blocked By**: T2

**Action**: Extract polling logic into reusable React hook

**Files to Create**:
- `.ai/alpha/scripts/ui/hooks/useProgressPoller.ts`

**Implementation**:

```typescript
import { useEffect, useRef } from 'react';
import type { Sandbox } from '@e2b/code-interpreter';
import type { SandboxProgressFile, SandboxState } from '../types.js';

const WORKSPACE_DIR = '/home/user/project';
const PROGRESS_FILE = '.initiative-progress.json';
const POLL_INTERVAL_MS = 15000; // 15 seconds (reduced from 30)

export interface UseProgressPollerOptions {
  sandbox: Sandbox;
  label: string;
  sessionStartTime: Date;
  onUpdate: (label: string, state: Partial<SandboxState>) => void;
  onError?: (label: string, error: Error) => void;
}

export function useProgressPoller({
  sandbox,
  label,
  sessionStartTime,
  onUpdate,
  onError,
}: UseProgressPollerOptions): void {
  const isPollingRef = useRef(true);

  useEffect(() => {
    isPollingRef.current = true;

    const poll = async () => {
      while (isPollingRef.current) {
        try {
          const result = await sandbox.commands.run(
            `cat ${WORKSPACE_DIR}/${PROGRESS_FILE} 2>/dev/null`,
            { timeoutMs: 5000 }
          );

          if (result.stdout?.trim()) {
            const progress: SandboxProgressFile = JSON.parse(result.stdout);

            // Filter stale data from previous sessions
            if (progress.last_heartbeat) {
              const heartbeatTime = new Date(progress.last_heartbeat).getTime();
              const sessionStart = sessionStartTime.getTime() - 5 * 60 * 1000;
              if (heartbeatTime < sessionStart) {
                // Stale data - skip
                await sleep(POLL_INTERVAL_MS);
                continue;
              }
            }

            // Transform to SandboxState
            const stateUpdate: Partial<SandboxState> = {
              currentFeature: progress.feature
                ? { id: progress.feature.issue_number, title: progress.feature.title }
                : null,
              currentTask: progress.current_task
                ? {
                    id: progress.current_task.id,
                    name: progress.current_task.name,
                    status: progress.current_task.status as SandboxState['currentTask']['status'],
                    verificationAttempts: progress.current_task.verification_attempts,
                  }
                : null,
              currentGroup: progress.current_group
                ? {
                    id: progress.current_group.id,
                    name: progress.current_group.name,
                    tasksTotal: progress.current_group.tasks_total,
                    tasksCompleted: progress.current_group.tasks_completed,
                  }
                : null,
              phase: (progress.phase as SandboxState['phase']) || 'executing',
              tasksCompleted: progress.completed_tasks?.length || 0,
              tasksTotal: progress.current_group?.tasks_total || 0,
              contextUsage: progress.context_usage_percent || 0,
              lastHeartbeat: progress.last_heartbeat
                ? new Date(progress.last_heartbeat)
                : null,
              lastTool: progress.last_tool || null,
              toolCount: progress.tool_count || 0,
            };

            onUpdate(label, stateUpdate);
          }
        } catch (error) {
          onError?.(label, error instanceof Error ? error : new Error(String(error)));
        }

        await sleep(POLL_INTERVAL_MS);
      }
    };

    poll();

    return () => {
      isPollingRef.current = false;
    };
  }, [sandbox, label, sessionStartTime, onUpdate, onError]);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

**Verification Command**:
```bash
cd .ai/alpha/scripts/ui && pnpm tsc hooks/useProgressPoller.ts --noEmit
```

**Acceptance Criterion**: Hook polls sandbox and transforms progress data correctly

---

### T11: Create UI Manager with State

**Priority**: 3
**Estimated Hours**: 2h
**Blocked By**: T9, T10

**Action**: Create main UI entry point with centralized state management

**Files to Create**:
- `.ai/alpha/scripts/ui/index.tsx`

**Implementation**:

```typescript
import React, { useState, useCallback, useEffect } from 'react';
import { render } from 'ink';
import type { Sandbox } from '@e2b/code-interpreter';
import { OrchestratorUI } from './components/OrchestratorUI.js';
import { useProgressPoller } from './hooks/useProgressPoller.js';
import type {
  UIState,
  SandboxState,
  OverallProgress,
  OrchestratorEvent,
} from './types.js';

export interface SandboxInstance {
  sandbox: Sandbox;
  id: string;
  label: string;
}

export interface StartUIOptions {
  specId: number;
  specName: string;
  sandboxInstances: SandboxInstance[];
  initialProgress: OverallProgress;
}

export function startUI(options: StartUIOptions): {
  updateOverallProgress: (progress: Partial<OverallProgress>) => void;
  addEvent: (event: Omit<OrchestratorEvent, 'id' | 'timestamp'>) => void;
  waitUntilExit: Promise<void>;
} {
  let updateProgressFn: (progress: Partial<OverallProgress>) => void = () => {};
  let addEventFn: (event: Omit<OrchestratorEvent, 'id' | 'timestamp'>) => void = () => {};

  const App = () => {
    const [state, setState] = useState<UIState>(() => ({
      sandboxes: new Map(
        options.sandboxInstances.map((inst) => [
          inst.label,
          {
            sandboxId: inst.id,
            label: inst.label,
            status: 'ready',
            currentFeature: null,
            currentTask: null,
            currentGroup: null,
            phase: 'idle',
            tasksCompleted: 0,
            tasksTotal: 0,
            contextUsage: 0,
            lastHeartbeat: null,
            lastTool: null,
            toolCount: 0,
            retryCount: 0,
          } satisfies SandboxState,
        ])
      ),
      overallProgress: options.initialProgress,
      events: [],
      sessionStartTime: new Date(),
      uiMode: 'dashboard',
    }));

    // Update sandbox state
    const updateSandboxState = useCallback(
      (label: string, update: Partial<SandboxState>) => {
        setState((prev) => {
          const newSandboxes = new Map(prev.sandboxes);
          const current = newSandboxes.get(label);
          if (current) {
            newSandboxes.set(label, { ...current, ...update });
          }
          return { ...prev, sandboxes: newSandboxes };
        });
      },
      []
    );

    // Update overall progress
    const updateOverallProgress = useCallback(
      (update: Partial<OverallProgress>) => {
        setState((prev) => ({
          ...prev,
          overallProgress: { ...prev.overallProgress, ...update },
        }));
      },
      []
    );

    // Add event
    const addEvent = useCallback(
      (event: Omit<OrchestratorEvent, 'id' | 'timestamp'>) => {
        setState((prev) => ({
          ...prev,
          events: [
            ...prev.events,
            {
              ...event,
              id: `event-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              timestamp: new Date(),
            },
          ],
        }));
      },
      []
    );

    // Expose functions for external use
    useEffect(() => {
      updateProgressFn = updateOverallProgress;
      addEventFn = addEvent;
    }, [updateOverallProgress, addEvent]);

    // Setup pollers for each sandbox
    for (const instance of options.sandboxInstances) {
      useProgressPoller({
        sandbox: instance.sandbox,
        label: instance.label,
        sessionStartTime: state.sessionStartTime,
        onUpdate: updateSandboxState,
        onError: (label, error) => {
          addEvent({
            type: 'error',
            sandboxLabel: label,
            message: `Poll error: ${error.message}`,
          });
        },
      });
    }

    return <OrchestratorUI state={state} />;
  };

  const { waitUntilExit } = render(<App />);

  return {
    updateOverallProgress: (progress) => updateProgressFn(progress),
    addEvent: (event) => addEventFn(event),
    waitUntilExit,
  };
}
```

**Verification Command**:
```bash
cd .ai/alpha/scripts/ui && pnpm tsc index.tsx --noEmit
```

**Acceptance Criterion**: UI manager initializes state and sets up polling for all sandboxes

---

## Phase 4: Orchestrator Integration

### T12: Add CLI Flag for UI Mode

**Priority**: 4
**Estimated Hours**: 1h
**Blocked By**: T11

**Action**: Add --ui-mode flag to orchestrator CLI

**Files to Modify**:
- `.ai/alpha/scripts/spec-orchestrator.ts`

**Implementation**:

Modify `OrchestratorOptions` interface:
```typescript
interface OrchestratorOptions {
  specId: number;
  sandboxCount: number;
  timeout: number;
  dryRun: boolean;
  forceUnlock: boolean;
  skipDbReset: boolean;
  skipDbSeed: boolean;
  uiMode: 'dashboard' | 'streaming';  // NEW
}
```

Modify `parseArgs()`:
```typescript
function parseArgs(): OrchestratorOptions {
  const options: OrchestratorOptions = {
    // ... existing defaults
    uiMode: 'dashboard',  // DEFAULT to dashboard
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    // ... existing parsing

    if (arg === '--ui-mode=dashboard') {
      options.uiMode = 'dashboard';
    } else if (arg === '--ui-mode=streaming') {
      options.uiMode = 'streaming';
    }
  }

  return options;
}
```

Update `showHelp()`:
```typescript
function showHelp(): void {
  console.log(`
Options:
  // ... existing options
  --ui-mode=dashboard   Persistent 3-column dashboard (default)
  --ui-mode=streaming   Classic streaming output
`);
}
```

**Verification Command**:
```bash
tsx .ai/alpha/scripts/spec-orchestrator.ts --help | grep ui-mode
```

**Acceptance Criterion**: `--ui-mode` flag is recognized and defaults to dashboard

---

### T13: Integrate UI with Orchestrator Main Loop

**Priority**: 4
**Estimated Hours**: 2h
**Blocked By**: T11, T12

**Action**: Modify orchestrator to use dashboard UI when in dashboard mode

**Files to Modify**:
- `.ai/alpha/scripts/spec-orchestrator.ts`

**Implementation**:

Add import at top:
```typescript
import { startUI } from './ui/index.js';
```

Modify `orchestrate()` function after sandbox creation:
```typescript
async function orchestrate(options: OrchestratorOptions): Promise<void> {
  // ... existing setup code ...

  // After creating sandboxes, before runWorkLoop
  if (options.uiMode === 'dashboard') {
    const ui = startUI({
      specId: manifest.metadata.spec_id,
      specName: manifest.metadata.spec_name,
      sandboxInstances: instances.map(i => ({
        sandbox: i.sandbox,
        id: i.id,
        label: i.label,
      })),
      initialProgress: {
        specId: manifest.metadata.spec_id,
        specName: manifest.metadata.spec_name,
        initiativesCompleted: manifest.progress.initiatives_completed,
        initiativesTotal: manifest.progress.initiatives_total,
        featuresCompleted: manifest.progress.features_completed,
        featuresTotal: manifest.progress.features_total,
        tasksCompleted: manifest.progress.tasks_completed,
        tasksTotal: manifest.progress.tasks_total,
        status: manifest.progress.status,
      },
    });

    // Run work loop (UI polls for updates)
    await runWorkLoop(instances, manifest, ui);

    // Wait for user to exit UI
    await ui.waitUntilExit;
  } else {
    // STREAMING MODE (existing behavior)
    await runWorkLoop(instances, manifest, null);
  }

  // ... existing cleanup code ...
}
```

Modify `runWorkLoop()` to accept UI reference:
```typescript
async function runWorkLoop(
  instances: SandboxInstance[],
  manifest: SpecManifest,
  ui: ReturnType<typeof startUI> | null,
): Promise<void> {
  // ... existing code ...

  // When feature completes, update UI
  if (ui) {
    ui.updateOverallProgress({
      featuresCompleted: manifest.progress.features_completed,
      tasksCompleted: manifest.progress.tasks_completed,
    });
    ui.addEvent({
      type: 'feature_complete',
      sandboxLabel: instance.label,
      message: `Completed #${feature.id}: ${feature.title}`,
    });
  }
}
```

**Verification Command**:
```bash
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --dry-run --ui-mode=dashboard
```

**Acceptance Criterion**: Dashboard UI renders and shows spec info in dry-run mode

---

## Phase 5: Progress Reporting Hooks

### T14: Create PostToolUse Heartbeat Hook

**Priority**: 5
**Estimated Hours**: 1h
**Blocked By**: None (can be done in parallel)

**Action**: Create Python hook for tool-based heartbeats

**Files to Create**:
- `.claude/hooks/heartbeat.py`

**Implementation**:

```python
#!/usr/bin/env python3
"""
PostToolUse hook for heartbeat signals.
Updates .initiative-progress.json on every tool call.
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

PROGRESS_FILE = Path('.initiative-progress.json')

def main():
    try:
        input_data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)  # Fail silently

    # Load existing progress
    progress = {}
    if PROGRESS_FILE.exists():
        try:
            progress = json.loads(PROGRESS_FILE.read_text())
        except Exception:
            pass

    # Update heartbeat fields
    now = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    progress['last_heartbeat'] = now
    progress['last_tool'] = input_data.get('tool_name', 'unknown')
    progress['session_id'] = input_data.get('session_id', progress.get('session_id'))

    # Track tool usage counts
    tool_counts = progress.get('tool_counts', {})
    tool_name = input_data.get('tool_name', 'unknown')
    tool_counts[tool_name] = tool_counts.get(tool_name, 0) + 1
    progress['tool_counts'] = tool_counts
    progress['tool_count'] = sum(tool_counts.values())

    # Write atomically
    temp_file = PROGRESS_FILE.with_suffix('.tmp')
    temp_file.write_text(json.dumps(progress, indent=2))
    temp_file.rename(PROGRESS_FILE)

    sys.exit(0)

if __name__ == '__main__':
    main()
```

**Verification Command**:
```bash
echo '{"tool_name": "Read", "session_id": "test123"}' | python3 .claude/hooks/heartbeat.py && cat .initiative-progress.json | jq .last_heartbeat
```

**Acceptance Criterion**: Hook writes heartbeat timestamp on each invocation

---

### T15: Create SubagentStop Hook

**Priority**: 5
**Estimated Hours**: 0.5h
**Blocked By**: T14

**Action**: Create hook for tracking subagent completion

**Files to Create**:
- `.claude/hooks/subagent_complete.py`

**Implementation**:

```python
#!/usr/bin/env python3
"""
SubagentStop hook for tracking Task tool completions.
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

PROGRESS_FILE = Path('.initiative-progress.json')

def main():
    try:
        input_data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    # Load existing progress
    progress = {}
    if PROGRESS_FILE.exists():
        try:
            progress = json.loads(PROGRESS_FILE.read_text())
        except Exception:
            pass

    # Update subagent tracking
    now = datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
    progress['last_heartbeat'] = now
    progress['last_subagent_stop'] = now

    subagent_count = progress.get('subagent_count', 0) + 1
    progress['subagent_count'] = subagent_count

    # Write atomically
    temp_file = PROGRESS_FILE.with_suffix('.tmp')
    temp_file.write_text(json.dumps(progress, indent=2))
    temp_file.rename(PROGRESS_FILE)

    # Output approval (don't block)
    print(json.dumps({"decision": "approve"}))
    sys.exit(0)

if __name__ == '__main__':
    main()
```

**Verification Command**:
```bash
echo '{"session_id": "test123"}' | python3 .claude/hooks/subagent_complete.py
```

**Acceptance Criterion**: Hook tracks subagent completions

---

### T16: Configure Hooks in Settings

**Priority**: 5
**Estimated Hours**: 0.5h
**Blocked By**: T14, T15

**Action**: Add hook configuration to Claude settings

**Files to Modify**:
- `.claude/settings.json`

**Implementation**:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ${CLAUDE_PROJECT_DIR}/.claude/hooks/heartbeat.py",
            "timeout": 3
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ${CLAUDE_PROJECT_DIR}/.claude/hooks/subagent_complete.py",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

**Verification Command**:
```bash
cat .claude/settings.json | jq '.hooks.PostToolUse'
```

**Acceptance Criterion**: Hooks are configured and will fire on tool usage

---

### T17: Update E2B Template with Hooks

**Priority**: 5
**Estimated Hours**: 1h
**Blocked By**: T16

**Action**: Update E2B sandbox template to include hooks

**Files to Modify**:
- E2B template configuration (slideheroes-claude-agent-dev)

**Implementation**:

The E2B template needs to include:
1. Copy `.claude/hooks/heartbeat.py` to template
2. Copy `.claude/hooks/subagent_complete.py` to template
3. Copy `.claude/settings.json` with hook configuration

This requires running:
```bash
npx e2b template build --name slideheroes-claude-agent-dev
```

**Verification Command**:
```bash
npx e2b sandbox create slideheroes-claude-agent-dev
# Then verify hooks exist in sandbox
```

**Acceptance Criterion**: New sandboxes include heartbeat hooks

---

## Phase 6: Health Check Updates

### T18: Update Health Check Logic

**Priority**: 6
**Estimated Hours**: 1h
**Blocked By**: T14, T17

**Action**: Update orchestrator health checks to use tool-based heartbeats

**Files to Modify**:
- `.ai/alpha/scripts/spec-orchestrator.ts`

**Implementation**:

Update constants:
```typescript
const HEALTH_CHECK_INTERVAL_MS = 30000;  // Reduced from 60000
const HEARTBEAT_STALE_TIMEOUT_MS = 2 * 60 * 1000;  // Reduced from 5 minutes
const STALL_TIMEOUT_MS = 5 * 60 * 1000;  // Reduced from 10 minutes
```

Update `checkSandboxHealth()`:
```typescript
async function checkSandboxHealth(
  instance: SandboxInstance,
): Promise<HealthCheckResult> {
  // ... existing code ...

  // Enhanced heartbeat check using tool-based signals
  if (progress.last_tool && progress.last_heartbeat) {
    const heartbeatTime = new Date(progress.last_heartbeat).getTime();
    const timeSinceActivity = now - heartbeatTime;

    // Tool-based heartbeats should update every few seconds during active work
    if (timeSinceActivity > HEARTBEAT_STALE_TIMEOUT_MS) {
      return {
        healthy: false,
        issue: 'stale_heartbeat',
        message: `No tool activity for ${Math.round(timeSinceActivity / 60000)} minutes (last: ${progress.last_tool})`,
        timeSinceStart,
        timeSinceHeartbeat: timeSinceActivity,
      };
    }
  }

  // ... rest of function ...
}
```

**Verification Command**:
```bash
pnpm typecheck
```

**Acceptance Criterion**: Health checks use reduced timeouts and detect stalls faster

---

## Phase 7: Testing & Polish

### T19: Add Error Boundaries

**Priority**: 7
**Estimated Hours**: 0.5h
**Blocked By**: T9

**Action**: Add error boundaries to prevent UI crashes

**Files to Create**:
- `.ai/alpha/scripts/ui/components/ErrorBoundary.tsx`

**Implementation**:

```typescript
import React, { Component, ReactNode } from 'react';
import { Box, Text } from 'ink';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <Box borderStyle="single" borderColor="red" padding={1}>
            <Text color="red">UI Error: {this.state.error?.message}</Text>
          </Box>
        )
      );
    }

    return this.props.children;
  }
}
```

**Verification Command**:
```bash
cd .ai/alpha/scripts/ui && pnpm tsc components/ErrorBoundary.tsx --noEmit
```

**Acceptance Criterion**: Error boundary catches and displays component errors gracefully

---

### T20: Create Component Index File

**Priority**: 7
**Estimated Hours**: 0.5h
**Blocked By**: T3-T9, T19

**Action**: Create barrel export for all components

**Files to Create**:
- `.ai/alpha/scripts/ui/components/index.ts`

**Implementation**:

```typescript
export { ProgressBar } from './ProgressBar.js';
export { Header } from './Header.js';
export { SandboxColumn } from './SandboxColumn.js';
export { SandboxGrid } from './SandboxGrid.js';
export { OverallProgress } from './OverallProgress.js';
export { EventLog } from './EventLog.js';
export { OrchestratorUI } from './OrchestratorUI.js';
export { ErrorBoundary } from './ErrorBoundary.js';
```

**Verification Command**:
```bash
cd .ai/alpha/scripts/ui && pnpm tsc components/index.ts --noEmit
```

**Acceptance Criterion**: All components exportable from single entry point

---

### T21: Integration Testing

**Priority**: 7
**Estimated Hours**: 2h
**Blocked By**: T13, T18

**Action**: Test complete integration with real sandboxes

**Test Scenarios**:

1. **Single Sandbox Mode**:
```bash
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 -s 1 --dry-run --ui-mode=dashboard
```

2. **Three Sandbox Mode**:
```bash
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 -s 3 --dry-run --ui-mode=dashboard
```

3. **Streaming Mode (backward compat)**:
```bash
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --dry-run --ui-mode=streaming
```

4. **Stall Detection**:
- Manually delete progress file in sandbox
- Verify health check detects stall within 2-3 minutes

5. **Hook Integration**:
- Run feature implementation
- Verify heartbeat updates on every tool call

**Verification Command**:
```bash
# Full integration test
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 -s 1 --ui-mode=dashboard
```

**Acceptance Criterion**: All test scenarios pass, UI updates correctly, stalls detected

---

## Execution Groups

### Group 1: Foundation (T1-T2)
**Hours**: 2h | **Parallel**: No dependencies

### Group 2: Core Components (T3-T9)
**Hours**: 6h | **Parallel**: T3, T4, T7, T8 can run in parallel after T2

### Group 3: State Management (T10-T11)
**Hours**: 4h | **Sequential**: Depends on Group 2

### Group 4: Orchestrator Integration (T12-T13)
**Hours**: 3h | **Sequential**: Depends on Group 3

### Group 5: Hooks (T14-T17)
**Hours**: 3h | **Parallel**: Can run alongside Groups 2-4

### Group 6: Health Checks (T18)
**Hours**: 1h | **Sequential**: Depends on T17

### Group 7: Testing & Polish (T19-T21)
**Hours**: 3h | **Sequential**: Depends on Groups 4 and 6

---

## Summary

| Phase | Tasks | Hours | Can Parallelize |
|-------|-------|-------|-----------------|
| Foundation | T1-T2 | 2h | No |
| Core Components | T3-T9 | 6h | Partially |
| State Management | T10-T11 | 4h | No |
| Orchestrator Integration | T12-T13 | 3h | No |
| Hooks | T14-T17 | 3h | Yes (parallel track) |
| Health Checks | T18 | 1h | No |
| Testing | T19-T21 | 3h | No |
| **Total** | **21 tasks** | **22h** | **~16h parallel** |

---

## Files Created/Modified Summary

### New Files (14)
```
.ai/alpha/scripts/ui/
├── package.json
├── tsconfig.json
├── types.ts
├── index.tsx
├── components/
│   ├── index.ts
│   ├── ProgressBar.tsx
│   ├── Header.tsx
│   ├── SandboxColumn.tsx
│   ├── SandboxGrid.tsx
│   ├── OverallProgress.tsx
│   ├── EventLog.tsx
│   ├── OrchestratorUI.tsx
│   └── ErrorBoundary.tsx
└── hooks/
    └── useProgressPoller.ts

.claude/hooks/
├── heartbeat.py
└── subagent_complete.py
```

### Modified Files (2)
```
.ai/alpha/scripts/spec-orchestrator.ts
.claude/settings.json
```

---

## Validation Commands

After implementation, run these to verify:

```bash
# Type check
pnpm typecheck

# Lint
pnpm lint

# Dry run with dashboard
tsx .ai/alpha/scripts/spec-orchestrator.ts 1362 --dry-run --ui-mode=dashboard

# Test hooks
echo '{"tool_name": "Read"}' | python3 .claude/hooks/heartbeat.py && cat .initiative-progress.json
```
