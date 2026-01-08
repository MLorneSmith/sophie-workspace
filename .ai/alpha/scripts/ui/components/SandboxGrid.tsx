import React from 'react';
import { Box, Text } from 'ink';
import { SandboxColumn, CompactSandboxColumn } from './SandboxColumn.js';
import type { SandboxGridProps, SandboxState } from '../types.js';

/**
 * Standard sandbox labels
 */
const SANDBOX_LABELS = ['sbx-a', 'sbx-b', 'sbx-c'] as const;

/**
 * SandboxGrid component - renders 1-3 sandbox columns side by side
 *
 * Displays sandboxes in a horizontal row layout using flexbox.
 * Each sandbox gets equal width (33% for 3 sandboxes).
 * Handles gracefully when fewer than 3 sandboxes are present.
 */
export const SandboxGrid: React.FC<SandboxGridProps> = ({ sandboxes }) => {
  // Get sandboxes in order
  const orderedSandboxes: Array<[string, SandboxState]> = [];

  for (const label of SANDBOX_LABELS) {
    const state = sandboxes.get(label);
    if (state) {
      orderedSandboxes.push([label, state]);
    }
  }

  if (orderedSandboxes.length === 0) {
    return (
      <Box marginY={1} paddingX={2}>
        <Text dimColor>No sandboxes active...</Text>
      </Box>
    );
  }

  return (
    <Box justifyContent="space-between" marginY={1}>
      {orderedSandboxes.map(([label, state]) => (
        <SandboxColumn key={label} state={state} />
      ))}
    </Box>
  );
};

/**
 * Compact grid for narrow terminals
 */
export const CompactSandboxGrid: React.FC<SandboxGridProps> = ({
  sandboxes,
}) => {
  const orderedSandboxes: Array<[string, SandboxState]> = [];

  for (const label of SANDBOX_LABELS) {
    const state = sandboxes.get(label);
    if (state) {
      orderedSandboxes.push([label, state]);
    }
  }

  if (orderedSandboxes.length === 0) {
    return <Text dimColor>No sandboxes</Text>;
  }

  return (
    <Box justifyContent="space-around">
      {orderedSandboxes.map(([label, state]) => (
        <CompactSandboxColumn key={label} state={state} />
      ))}
    </Box>
  );
};

/**
 * Vertical sandbox list (for very narrow terminals)
 */
export const SandboxList: React.FC<SandboxGridProps> = ({ sandboxes }) => {
  const orderedSandboxes: Array<[string, SandboxState]> = [];

  for (const label of SANDBOX_LABELS) {
    const state = sandboxes.get(label);
    if (state) {
      orderedSandboxes.push([label, state]);
    }
  }

  return (
    <Box flexDirection="column" marginY={1}>
      {orderedSandboxes.map(([label, state]) => (
        <SandboxColumn key={label} state={state} />
      ))}
    </Box>
  );
};

/**
 * Summary row showing all sandbox statuses in one line
 */
export const SandboxSummaryRow: React.FC<SandboxGridProps> = ({ sandboxes }) => {
  const summaries: string[] = [];

  for (const label of SANDBOX_LABELS) {
    const state = sandboxes.get(label);
    if (state && state.currentFeature) {
      summaries.push(
        `${label}: #${state.currentFeature.id} [${state.tasksCompleted}/${state.tasksTotal}]`
      );
    } else if (state) {
      summaries.push(`${label}: idle`);
    }
  }

  return (
    <Box>
      <Text>{summaries.join(' | ')}</Text>
    </Box>
  );
};
