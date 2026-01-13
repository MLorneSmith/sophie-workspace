#!/usr/bin/env python3
"""
FastAPI Event Server for Alpha Orchestrator

Receives events via HTTP POST from Claude Code hooks in E2B sandboxes
and broadcasts them to connected WebSocket clients (Ink TUI).

Usage:
    python3 .ai/alpha/scripts/event-server.py [--port PORT]

Endpoints:
    POST /api/events - Receive events from hooks
    GET /api/events - Query recent events (optional ?sandbox_id filter)
    GET /ws - WebSocket connection for real-time event streaming
    GET /health - Health check endpoint

Environment:
    EVENT_SERVER_PORT - Port to listen on (default: 9000)
"""

import argparse
import asyncio
import json
import os
import sys
from collections import deque
from datetime import datetime, timezone
from typing import Optional

try:
    from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import JSONResponse
    import uvicorn
except ImportError:
    print("Error: Required packages not installed.", file=sys.stderr)
    print("Install with: pip install fastapi uvicorn websockets", file=sys.stderr)
    sys.exit(1)


# Configuration
DEFAULT_PORT = 9000
MAX_EVENTS = 1000
PING_INTERVAL = 30  # seconds


# Initialize FastAPI app
app = FastAPI(
    title="Alpha Event Server",
    description="Real-time event streaming for Alpha Orchestrator",
    version="1.0.0",
)

# Add CORS middleware for localhost access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:*", "http://127.0.0.1:*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# In-memory event storage with rotation
class EventStore:
    """Thread-safe event storage with WebSocket broadcasting."""

    def __init__(self, max_events: int = MAX_EVENTS):
        self.events: deque = deque(maxlen=max_events)
        self.websocket_clients: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def add_event(self, event: dict) -> None:
        """Add an event and broadcast to all connected clients."""
        async with self._lock:
            # Ensure timestamp
            if "timestamp" not in event:
                event["timestamp"] = datetime.now(timezone.utc).isoformat()

            # Add unique ID if not present
            if "id" not in event:
                event["id"] = f"{event.get('sandbox_id', 'unknown')}-{len(self.events)}-{datetime.now(timezone.utc).timestamp()}"

            self.events.append(event)

        # Broadcast to all connected WebSocket clients
        await self.broadcast(event)

    async def broadcast(self, event: dict) -> None:
        """Broadcast event to all connected WebSocket clients."""
        if not self.websocket_clients:
            return

        message = json.dumps({"type": "event", "data": event})
        disconnected = set()

        for client in self.websocket_clients:
            try:
                await client.send_text(message)
            except Exception:
                disconnected.add(client)

        # Remove disconnected clients
        for client in disconnected:
            self.websocket_clients.discard(client)

    def get_events(
        self,
        sandbox_id: Optional[str] = None,
        limit: int = 100,
        event_type: Optional[str] = None,
    ) -> list[dict]:
        """Get recent events, optionally filtered."""
        events = list(self.events)

        # Filter by sandbox_id
        if sandbox_id:
            events = [e for e in events if e.get("sandbox_id") == sandbox_id]

        # Filter by event_type
        if event_type:
            events = [e for e in events if e.get("event_type") == event_type]

        # Return most recent (reversed, then sliced)
        return list(reversed(events))[:limit]

    def add_client(self, websocket: WebSocket) -> None:
        """Add a WebSocket client."""
        self.websocket_clients.add(websocket)

    def remove_client(self, websocket: WebSocket) -> None:
        """Remove a WebSocket client."""
        self.websocket_clients.discard(websocket)

    @property
    def client_count(self) -> int:
        """Get the number of connected clients."""
        return len(self.websocket_clients)


# Global event store
event_store = EventStore()


# Track server start time for uptime
server_start_time = datetime.now(timezone.utc)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    uptime_seconds = (datetime.now(timezone.utc) - server_start_time).total_seconds()
    return JSONResponse({
        "status": "healthy",
        "uptime_seconds": int(uptime_seconds),
        "events_stored": len(event_store.events),
        "websocket_clients": event_store.client_count,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


@app.post("/api/events")
async def receive_event(event: dict):
    """
    Receive an event from a Claude Code hook.

    Expected event format:
    {
        "sandbox_id": "sbx-abc123",
        "event_type": "post_tool_use" | "subagent_stop" | "stop" | "heartbeat",
        "tool_name": "Write",  # for post_tool_use
        "session_id": "session-123",
        "timestamp": "2024-01-01T12:00:00Z",
        "data": {}  # optional additional data
    }
    """
    # Validate required fields
    if "sandbox_id" not in event:
        return JSONResponse(
            {"error": "sandbox_id is required"},
            status_code=400,
        )

    if "event_type" not in event:
        return JSONResponse(
            {"error": "event_type is required"},
            status_code=400,
        )

    # Add server timestamp if not present
    if "server_received_at" not in event:
        event["server_received_at"] = datetime.now(timezone.utc).isoformat()

    # Store and broadcast
    await event_store.add_event(event)

    return JSONResponse({"status": "received", "event_id": event.get("id")})


@app.get("/api/events")
async def get_events(
    sandbox_id: Optional[str] = Query(None, description="Filter by sandbox ID"),
    limit: int = Query(100, ge=1, le=1000, description="Max events to return"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
):
    """Query recent events."""
    events = event_store.get_events(
        sandbox_id=sandbox_id,
        limit=limit,
        event_type=event_type,
    )
    return JSONResponse({
        "events": events,
        "count": len(events),
        "total_stored": len(event_store.events),
    })


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time event streaming."""
    await websocket.accept()
    event_store.add_client(websocket)

    # Send initial connection message with recent events
    try:
        # Send connection confirmation
        await websocket.send_text(json.dumps({
            "type": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "events_available": len(event_store.events),
        }))

        # Send recent events as initial batch
        recent_events = event_store.get_events(limit=50)
        if recent_events:
            await websocket.send_text(json.dumps({
                "type": "initial_events",
                "data": recent_events,
            }))

        # Keep connection alive with ping/pong
        while True:
            try:
                # Wait for messages or ping periodically
                message = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=PING_INTERVAL,
                )

                # Handle ping messages
                if message == "ping":
                    await websocket.send_text(json.dumps({
                        "type": "pong",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }))

            except asyncio.TimeoutError:
                # Send ping to keep connection alive
                try:
                    await websocket.send_text(json.dumps({
                        "type": "ping",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }))
                except Exception:
                    break

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}", file=sys.stderr)
    finally:
        event_store.remove_client(websocket)


def main():
    """Run the event server."""
    parser = argparse.ArgumentParser(description="Alpha Event Server")
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("EVENT_SERVER_PORT", DEFAULT_PORT)),
        help=f"Port to listen on (default: {DEFAULT_PORT})",
    )
    parser.add_argument(
        "--host",
        type=str,
        default="0.0.0.0",
        help="Host to bind to (default: 0.0.0.0)",
    )
    args = parser.parse_args()

    print(f"Starting Alpha Event Server on {args.host}:{args.port}")
    print(f"Health check: http://localhost:{args.port}/health")
    print(f"WebSocket: ws://localhost:{args.port}/ws")
    print(f"Events API: http://localhost:{args.port}/api/events")

    uvicorn.run(
        app,
        host=args.host,
        port=args.port,
        log_level="info",
    )


if __name__ == "__main__":
    main()
