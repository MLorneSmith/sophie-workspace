/**
 * React hook for WebSocket event streaming from the Alpha Event Server.
 *
 * Connects to the event server's WebSocket endpoint and provides:
 * - Real-time event streaming
 * - Auto-reconnect on disconnect
 * - Connection status tracking
 * - Event buffering with max limit
 *
 * @example
 * const { status, events, eventCount, reconnect } = useEventStream({
 *   url: 'ws://localhost:9000/ws',
 *   onEvent: (event) => console.log('Event:', event),
 * });
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type {
	EventServerStatus,
	UseEventStreamOptions,
	UseEventStreamResult,
	WebSocketEvent,
	WebSocketMessage,
} from "../types.js";
import {
	WEBSOCKET_MAX_RECONNECT_ATTEMPTS,
	WEBSOCKET_RECONNECT_DELAY_MS,
} from "../types.js";

/**
 * Custom hook for WebSocket event streaming
 */
export function useEventStream(
	options: UseEventStreamOptions,
): UseEventStreamResult {
	const {
		url,
		enabled = true,
		onEvent,
		onStatusChange,
		maxEvents = 100,
		reconnectDelay = WEBSOCKET_RECONNECT_DELAY_MS,
		maxReconnectAttempts = WEBSOCKET_MAX_RECONNECT_ATTEMPTS,
	} = options;

	// State
	const [status, setStatus] = useState<EventServerStatus>("disconnected");
	const [events, setEvents] = useState<WebSocketEvent[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [eventCount, setEventCount] = useState(0);

	// Refs for WebSocket and reconnection
	const wsRef = useRef<WebSocket | null>(null);
	const reconnectAttemptsRef = useRef(0);
	const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const mountedRef = useRef(true);
	const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Update status and notify callback
	const updateStatus = useCallback(
		(newStatus: EventServerStatus) => {
			setStatus(newStatus);
			onStatusChange?.(newStatus);
		},
		[onStatusChange],
	);

	// Add event to buffer
	const addEvent = useCallback(
		(event: WebSocketEvent) => {
			setEvents((prev) => {
				const newEvents = [event, ...prev].slice(0, maxEvents);
				return newEvents;
			});
			setEventCount((c) => c + 1);
			onEvent?.(event);
		},
		[maxEvents, onEvent],
	);

	// Add multiple events (for initial batch)
	const addEvents = useCallback(
		(newEvents: WebSocketEvent[]) => {
			setEvents((prev) => {
				// Merge and dedupe by id
				const allEvents = [...newEvents, ...prev];
				const seen = new Set<string>();
				const deduped = allEvents.filter((e) => {
					if (seen.has(e.id)) return false;
					seen.add(e.id);
					return true;
				});
				return deduped.slice(0, maxEvents);
			});
		},
		[maxEvents],
	);

	// Connect to WebSocket
	const connect = useCallback(() => {
		if (!enabled || !mountedRef.current) return;

		// Don't connect if already connecting/connected
		if (
			wsRef.current?.readyState === WebSocket.CONNECTING ||
			wsRef.current?.readyState === WebSocket.OPEN
		) {
			return;
		}

		updateStatus("connecting");
		setError(null);

		try {
			const ws = new WebSocket(url);
			wsRef.current = ws;

			ws.onopen = () => {
				if (!mountedRef.current) {
					ws.close();
					return;
				}

				updateStatus("connected");
				reconnectAttemptsRef.current = 0;

				// Start ping interval to keep connection alive
				if (pingIntervalRef.current) {
					clearInterval(pingIntervalRef.current);
				}
				pingIntervalRef.current = setInterval(() => {
					if (ws.readyState === WebSocket.OPEN) {
						ws.send("ping");
					}
				}, 25000); // Ping every 25 seconds
			};

			ws.onmessage = (event) => {
				if (!mountedRef.current) return;

				try {
					const message: WebSocketMessage = JSON.parse(event.data);

					switch (message.type) {
						case "connected":
							// Connection confirmed by server
							break;

						case "initial_events":
							// Batch of recent events
							if (Array.isArray(message.data)) {
								addEvents(message.data);
							}
							break;

						case "event":
							// Single new event
							if (message.data && !Array.isArray(message.data)) {
								addEvent(message.data);
							}
							break;

						case "ping":
							// Server ping, respond with pong
							ws.send(JSON.stringify({ type: "pong" }));
							break;

						case "pong":
							// Response to our ping, connection is alive
							break;
					}
				} catch (parseError) {
					console.error("Failed to parse WebSocket message:", parseError);
				}
			};

			ws.onerror = () => {
				if (!mountedRef.current) return;
				console.error("WebSocket error");
				setError("WebSocket connection error");
			};

			ws.onclose = () => {
				if (!mountedRef.current) return;

				// Clear ping interval
				if (pingIntervalRef.current) {
					clearInterval(pingIntervalRef.current);
					pingIntervalRef.current = null;
				}

				// Don't reconnect if we're intentionally disconnected
				if (!enabled) {
					updateStatus("disconnected");
					return;
				}

				// Attempt reconnection
				if (reconnectAttemptsRef.current < maxReconnectAttempts) {
					updateStatus("connecting");
					reconnectAttemptsRef.current++;

					const delay = Math.min(
						reconnectDelay * 1.5 ** (reconnectAttemptsRef.current - 1),
						30000, // Max 30 seconds
					);

					reconnectTimeoutRef.current = setTimeout(() => {
						if (mountedRef.current && enabled) {
							connect();
						}
					}, delay);
				} else {
					updateStatus("error");
					setError("Max reconnection attempts reached");
				}
			};
		} catch (connectError) {
			console.error("Failed to create WebSocket:", connectError);
			updateStatus("error");
			setError(
				connectError instanceof Error
					? connectError.message
					: "Connection failed",
			);
		}
	}, [
		url,
		enabled,
		updateStatus,
		addEvent,
		addEvents,
		reconnectDelay,
		maxReconnectAttempts,
	]);

	// Disconnect from WebSocket
	const disconnect = useCallback(() => {
		// Clear reconnect timeout
		if (reconnectTimeoutRef.current) {
			clearTimeout(reconnectTimeoutRef.current);
			reconnectTimeoutRef.current = null;
		}

		// Clear ping interval
		if (pingIntervalRef.current) {
			clearInterval(pingIntervalRef.current);
			pingIntervalRef.current = null;
		}

		// Close WebSocket
		if (wsRef.current) {
			wsRef.current.close();
			wsRef.current = null;
		}

		updateStatus("disconnected");
	}, [updateStatus]);

	// Manual reconnect
	const reconnect = useCallback(() => {
		disconnect();
		reconnectAttemptsRef.current = 0;
		connect();
	}, [connect, disconnect]);

	// Connect on mount, disconnect on unmount
	useEffect(() => {
		mountedRef.current = true;

		if (enabled) {
			connect();
		}

		return () => {
			mountedRef.current = false;
			disconnect();
		};
	}, [enabled, connect, disconnect]);

	return {
		status,
		events,
		error,
		eventCount,
		reconnect,
		disconnect,
	};
}

export default useEventStream;
