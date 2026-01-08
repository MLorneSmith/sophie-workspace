import React from 'react';
import { Box, Text } from 'ink';
import type { EventLogProps, OrchestratorEvent, OrchestratorEventType } from '../types.js';
import { MAX_DISPLAY_EVENTS } from '../types.js';

/**
 * Event type icons
 */
const EVENT_ICONS: Record<OrchestratorEventType, string> = {
  task_start: '▶️',
  task_complete: '✅',
  task_failed: '❌',
  feature_start: '🚀',
  feature_complete: '🎉',
  group_complete: '📦',
  commit: '📝',
  push: '🚀',
  error: '❌',
  health_warning: '⚠️',
  stall_detected: '🔴',
  sandbox_restart: '🔄',
  context_limit: '📊',
};

/**
 * Event type colors
 */
const EVENT_COLORS: Record<OrchestratorEventType, string> = {
  task_start: 'blue',
  task_complete: 'green',
  task_failed: 'red',
  feature_start: 'magenta',
  feature_complete: 'magenta',
  group_complete: 'cyan',
  commit: 'cyan',
  push: 'cyan',
  error: 'red',
  health_warning: 'yellow',
  stall_detected: 'red',
  sandbox_restart: 'yellow',
  context_limit: 'yellow',
};

/**
 * Format timestamp for display (HH:MM:SS)
 */
function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Get sandbox label color
 */
function getSandboxColor(label: string): string {
  const colors: Record<string, string> = {
    'sbx-a': 'cyan',
    'sbx-b': 'magenta',
    'sbx-c': 'yellow',
  };
  return colors[label] || 'white';
}

/**
 * Single event row component
 */
const EventRow: React.FC<{ event: OrchestratorEvent }> = ({ event }) => {
  const icon = EVENT_ICONS[event.type] || '•';
  const color = EVENT_COLORS[event.type] || 'white';
  const sandboxColor = getSandboxColor(event.sandboxLabel);

  return (
    <Box>
      <Text dimColor>{formatTimestamp(event.timestamp)}</Text>
      <Text> </Text>
      <Text color={sandboxColor}>[{event.sandboxLabel}]</Text>
      <Text> {icon} </Text>
      <Text color={color}>{truncateMessage(event.message, 50)}</Text>
    </Box>
  );
};

/**
 * Truncate message to fit display
 */
function truncateMessage(message: string, maxLength: number): string {
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength - 3) + '...';
}

/**
 * Event log component showing recent orchestrator events
 *
 * Displays a scrollable feed of events with:
 * - Timestamp
 * - Sandbox label (color-coded)
 * - Event icon
 * - Message (color-coded by type)
 */
export const EventLog: React.FC<EventLogProps> = ({
  events,
  maxEvents = MAX_DISPLAY_EVENTS,
}) => {
  // Get most recent events
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
        recentEvents.map((event) => <EventRow key={event.id} event={event} />)
      )}

      {events.length > maxEvents && (
        <Text dimColor italic>
          ... and {events.length - maxEvents} more events
        </Text>
      )}
    </Box>
  );
};

/**
 * Compact event log showing only last few events
 */
export const CompactEventLog: React.FC<EventLogProps> = ({
  events,
  maxEvents = 3,
}) => {
  const recentEvents = events.slice(-maxEvents);

  return (
    <Box flexDirection="column" paddingX={1}>
      {recentEvents.map((event) => (
        <Box key={event.id}>
          <Text dimColor>{formatTimestamp(event.timestamp)} </Text>
          <Text color={EVENT_COLORS[event.type]}>
            {EVENT_ICONS[event.type]} {truncateMessage(event.message, 40)}
          </Text>
        </Box>
      ))}
    </Box>
  );
};

/**
 * Event count summary
 */
export const EventSummary: React.FC<{ events: OrchestratorEvent[] }> = ({
  events,
}) => {
  const errorCount = events.filter(
    (e) => e.type === 'error' || e.type === 'task_failed'
  ).length;
  const warningCount = events.filter(
    (e) => e.type === 'health_warning' || e.type === 'stall_detected'
  ).length;
  const completedCount = events.filter(
    (e) => e.type === 'task_complete' || e.type === 'feature_complete'
  ).length;

  return (
    <Box>
      {errorCount > 0 && (
        <Text color="red">
          {errorCount} error{errorCount !== 1 ? 's' : ''}
        </Text>
      )}
      {warningCount > 0 && (
        <>
          {errorCount > 0 && <Text dimColor> | </Text>}
          <Text color="yellow">
            {warningCount} warning{warningCount !== 1 ? 's' : ''}
          </Text>
        </>
      )}
      {completedCount > 0 && (
        <>
          {(errorCount > 0 || warningCount > 0) && <Text dimColor> | </Text>}
          <Text color="green">{completedCount} completed</Text>
        </>
      )}
    </Box>
  );
};
