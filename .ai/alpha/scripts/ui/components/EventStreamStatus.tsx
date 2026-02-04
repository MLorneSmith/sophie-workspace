/**
 * EventStreamStatus Component
 *
 * Displays the connection status indicator for the WebSocket event stream.
 * Shows:
 * - Connection status icon (green/yellow/red circle)
 * - Status text (Connected/Connecting/Disconnected)
 * - Event count since connection
 *
 * Designed to be compact for header integration.
 */

import { Box, Text } from "ink";
// biome-ignore lint/correctness/noUnusedImports: React must be in scope at runtime for Ink/react-reconciler
import React, { type FC } from "react";
import type { EventServerStatus, EventStreamStatusProps } from "../types.js";

/**
 * Status indicator colors
 */
const STATUS_COLORS: Record<EventServerStatus, string> = {
	connected: "green",
	connecting: "yellow",
	disconnected: "gray",
	error: "red",
};

/**
 * Status indicator icons (emoji circles)
 */
const STATUS_ICONS: Record<EventServerStatus, string> = {
	connected: "🟢",
	connecting: "🟡",
	disconnected: "⚪",
	error: "🔴",
};

/**
 * Status text labels
 */
const STATUS_TEXT: Record<EventServerStatus, string> = {
	connected: "Stream",
	connecting: "Connecting...",
	disconnected: "Offline",
	error: "Error",
};

/**
 * EventStreamStatus component - shows WebSocket connection status
 */
export const EventStreamStatus: FC<EventStreamStatusProps> = ({
	status,
	eventCount = 0,
}) => {
	return (
		<Box>
			<Text>{STATUS_ICONS[status]}</Text>
			<Text color={STATUS_COLORS[status]}> {STATUS_TEXT[status]}</Text>
			{status === "connected" && eventCount > 0 && (
				<Text dimColor> ({eventCount})</Text>
			)}
		</Box>
	);
};

/**
 * Compact version showing just icon and count
 *
 * Bug fix #1923: Use ternary operator instead of && short-circuit to prevent
 * rendering raw number "0" which causes Ink error:
 * "Text string '0' must be rendered inside <Text> component"
 */
export const CompactEventStreamStatus: FC<EventStreamStatusProps> = ({
	status,
	eventCount = 0,
}) => {
	return (
		<Box>
			<Text>{STATUS_ICONS[status]}</Text>
			{eventCount > 0 ? <Text dimColor>{eventCount}</Text> : null}
		</Box>
	);
};

/**
 * Verbose version with more details
 */
export const VerboseEventStreamStatus: FC<
	EventStreamStatusProps & { reconnectAttempts?: number }
> = ({ status, eventCount = 0, lastEventAt, reconnectAttempts = 0 }) => {
	return (
		<Box flexDirection="column">
			<Box>
				<Text>{STATUS_ICONS[status]}</Text>
				<Text color={STATUS_COLORS[status]}> {STATUS_TEXT[status]}</Text>
			</Box>
			{status === "connected" && (
				<Box>
					<Text dimColor>Events: {eventCount}</Text>
					{lastEventAt && (
						<Text dimColor> | Last: {lastEventAt.toLocaleTimeString()}</Text>
					)}
				</Box>
			)}
			{status === "connecting" && reconnectAttempts > 0 && (
				<Text dimColor>Attempt {reconnectAttempts}</Text>
			)}
			{status === "error" && (
				<Text color="red" dimColor>
					Stream disconnected
				</Text>
			)}
		</Box>
	);
};

export default EventStreamStatus;
