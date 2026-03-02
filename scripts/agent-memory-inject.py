#!/usr/bin/env python3
"""
Agent Memory Injection — Query Mem0 for agent-scoped memories.

Usage:
    python3 agent-memory-inject.py <agent_id>
    python3 agent-memory-inject.py neo
    python3 agent-memory-inject.py hemingway --max 10 --budget 1500

Outputs a formatted context block ready to inject into a task brief.
"""

import json
import os
import subprocess
import sys
import argparse
from pathlib import Path

CONFIG_PATH = Path.home() / "clawd" / "config" / "agent-memory-scopes.json"

def load_config():
    return json.loads(CONFIG_PATH.read_text())

def search_memories(query: str, top_k: int = 5) -> list[dict]:
    """Search Mem0 via openclaw CLI and parse results."""
    try:
        result = subprocess.run(
            ["openclaw", "mem0", "search", query, "--json"],
            capture_output=True, text=True, timeout=15,
            env={**os.environ, "PATH": os.environ.get("PATH", "") + ":/home/ubuntu/.npm-global/bin"}
        )
        if result.returncode == 0 and result.stdout.strip():
            try:
                return json.loads(result.stdout)
            except json.JSONDecodeError:
                # Parse text output
                pass
    except Exception:
        pass
    
    # Fallback: parse text output
    try:
        result = subprocess.run(
            ["openclaw", "mem0", "search", query],
            capture_output=True, text=True, timeout=15,
            env={**os.environ, "PATH": os.environ.get("PATH", "") + ":/home/ubuntu/.npm-global/bin"}
        )
        memories = []
        if result.returncode == 0:
            for line in result.stdout.splitlines():
                line = line.strip()
                if line and not line.startswith("[") and not line.startswith("Found"):
                    memories.append({"text": line, "score": 0.5})
        return memories
    except Exception:
        return []

def search_memories_api(query: str, top_k: int = 5) -> list[dict]:
    """Search Mem0 via gateway API."""
    import urllib.request
    
    secrets_path = Path.home() / ".openclaw" / ".secrets.env"
    gateway_token = ""
    if secrets_path.exists():
        for line in secrets_path.read_text().splitlines():
            if line.startswith("OPENCLAW_GATEWAY_TOKEN="):
                gateway_token = line.split("=", 1)[1].strip().strip("'\"").replace("\r", "")
    
    data = json.dumps({"query": query, "limit": top_k}).encode()
    req = urllib.request.Request(
        "http://127.0.0.1:18789/api/memory/search",
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {gateway_token}"
        }
    )
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            results = json.loads(resp.read())
            if isinstance(results, list):
                return results
            elif isinstance(results, dict) and "results" in results:
                return results["results"]
    except Exception:
        pass
    return []

def estimate_tokens(text: str) -> int:
    """Rough token estimate (~4 chars per token)."""
    return len(text) // 4

def main():
    parser = argparse.ArgumentParser(description="Generate scoped memory context for sub-agents")
    parser.add_argument("agent_id", help="Agent ID (neo, hemingway, kvoth, michelangelo, viral)")
    parser.add_argument("--max", type=int, default=None, help="Max memories to include")
    parser.add_argument("--budget", type=int, default=None, help="Token budget")
    parser.add_argument("--format", choices=["markdown", "text", "json"], default="markdown")
    args = parser.parse_args()
    
    config = load_config()
    agent_id = args.agent_id.lower()
    
    if agent_id not in config["agents"]:
        print(f"Unknown agent: {agent_id}. Available: {', '.join(config['agents'].keys())}", file=sys.stderr)
        sys.exit(1)
    
    agent_config = config["agents"][agent_id]
    max_memories = args.max or config.get("maxMemories", 15)
    token_budget = args.budget or config.get("tokenBudget", 2000)
    
    # Query Mem0 for each search query
    all_memories = {}  # deduplicate by text
    
    for query in agent_config["queries"]:
        results = search_memories(query, top_k=5)
        for mem in results:
            text = mem.get("text", mem.get("memory", ""))
            if text and text not in all_memories:
                score = mem.get("score", 0)
                all_memories[text] = score
    
    if not all_memories:
        print("No relevant memories found.", file=sys.stderr)
        sys.exit(0)
    
    # Sort by score (highest first) and apply limits
    sorted_memories = sorted(all_memories.items(), key=lambda x: x[1], reverse=True)
    
    selected = []
    total_tokens = 0
    
    for text, score in sorted_memories:
        tokens = estimate_tokens(text)
        if total_tokens + tokens > token_budget:
            break
        if len(selected) >= max_memories:
            break
        selected.append((text, score))
        total_tokens += tokens
    
    # Format output
    if args.format == "json":
        output = json.dumps([{"text": t, "score": s} for t, s in selected], indent=2)
    elif args.format == "text":
        output = "\n".join(f"- {t}" for t, _ in selected)
    else:  # markdown
        lines = [
            f"## 🧠 Context for {agent_config['name']}",
            f"_({len(selected)} memories, ~{total_tokens} tokens)_\n",
        ]
        for text, score in selected:
            lines.append(f"- {text}")
        output = "\n".join(lines)
    
    print(output)

if __name__ == "__main__":
    main()
