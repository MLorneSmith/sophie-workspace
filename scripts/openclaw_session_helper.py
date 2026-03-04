#!/usr/bin/env python3
"""
Helper to find OpenClaw session ID for a given channel.
Used by cron scripts to reuse existing sessions instead of creating new ones.
"""

import subprocess
import json
import os
import re
from pathlib import Path

SESSIONS_FILE = Path.home() / ".openclaw" / "agents" / "main" / "sessions" / "sessions.json"


def get_session_id_for_channel(channel: str, session_key_prefix: str = "agent:main:discord") -> str | None:
    """
    Find the most recent session ID for a given Discord channel.

    Args:
        channel: Discord channel ID (e.g., "1466532593754312899")
        session_key_prefix: Optional prefix to filter session keys (default: agent:main:discord)

    Returns:
        Session ID (UUID) if found, None otherwise
    """
    if not SESSIONS_FILE.exists():
        return None

    try:
        with open(SESSIONS_FILE) as f:
            sessions = json.load(f)

        # sessions.json is a dict with session keys as top-level keys
        # Look for sessions matching the channel
        target_pattern = f":channel:{channel}"

        matching_sessions = []
        for session_key, session_data in sessions.items():
            if target_pattern in session_key and isinstance(session_data, dict):
                session_id = session_data.get("sessionId", "")
                if session_id:
                    # Get the last updated timestamp
                    updated_at = session_data.get("updatedAt", session_data.get("createdAt", 0))
                    matching_sessions.append((updated_at, session_id))

        if matching_sessions:
            # Sort by updated_at and return the most recent
            matching_sessions.sort(key=lambda x: x[0], reverse=True)
            return matching_sessions[0][1]

    except (json.JSONDecodeError, IOError) as e:
        print(f"Error reading sessions: {e}")

    return None


def send_via_agent(session_id: str | None, message: str, channel: str = "discord", target: str = None) -> bool:
    """
    Send a message via openclaw agent, reusing session if available.

    Args:
        session_id: Session ID to use (if None, creates new session)
        message: Message to send
        channel: Channel (discord, telegram, etc.)
        target: Target (channel ID, user, etc.)

    Returns:
        True if successful, False otherwise
    """
    cmd = ["openclaw", "agent", "--message", message, "--deliver"]

    if session_id:
        cmd.extend(["--session-id", session_id])

    if channel:
        cmd.extend(["--channel", channel])

    if target:
        cmd.extend(["--reply-to", target])

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60
        )
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        print("Timeout sending message via agent")
        return False
    except subprocess.SubprocessError as e:
        print(f"Error sending message: {e}")
        return False


def find_and_send(message: str, channel_id: str, channel: str = "discord") -> bool:
    """
    Convenience function: find session for channel and send message.

    Args:
        message: Message to send
        channel_id: Discord channel ID
        channel: Channel type (default: discord)

    Returns:
        True if successful, False otherwise
    """
    session_id = get_session_id_for_channel(channel_id)
    if session_id:
        print(f"Found session {session_id} for channel {channel_id}")
        return send_via_agent(session_id, message, channel, channel_id)
    else:
        print(f"No session found for channel {channel_id}, sending via message send")
        # Fallback to message send
        cmd = ["openclaw", "message", "send",
               "--channel", channel,
               "--target", channel_id,
               "--message", message]
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            return result.returncode == 0
        except subprocess.SubprocessError:
            return False


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        channel_id = sys.argv[1]
        session_id = get_session_id_for_channel(channel_id)
        if session_id:
            print(session_id)
        else:
            print("")
