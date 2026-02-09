#!/usr/bin/env python3
"""Sophie Loop Orchestrator (Phase 6)

Coordinates parallel task execution across initiatives. This script produces
JSON instructions for the main Sophie session to act on (spawn agents, check
results, escalate). It does NOT call OpenClaw APIs directly.

Commands:
  plan         -> Select next tasks from MC backlog, assign agent profiles, output execution plan
  next-batch   -> Pick the next N tasks to run in parallel from a plan
  consistency  -> Given completed outputs from an initiative batch, produce a consistency check prompt
  escalate     -> Check a task's meta for escalation triggers and output recommendations

Usage (from Sophie main session):
  1. python3 orchestrator.py plan --objective 1 --max-tasks 6
  2. python3 orchestrator.py next-batch --plan-file runs/plan.json --slots 3
  3. For each task: run loop-runner.py prepare → spawn → review-prep → spawn → process-review
  4. When a batch completes: python3 orchestrator.py consistency --initiative-id 15 --output-dir runs/
  5. If any task fails: python3 orchestrator.py escalate --task-id 86
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

MC_BASE = "http://localhost:3001/api/v1"
AI_DIR = Path(os.path.expanduser("~/clawd/.ai")).resolve()

# Priority mapping for objectives (Q1 2026)
OBJECTIVE_PRIORITY = {
    2: 1,   # Obj 1: Product (board_id=2)
    4: 2,   # Obj 6: AI Systems (board_id=4)
    1: 3,   # Obj 7: Business OS (board_id=1)
    6: 4,   # Obj 2: Audience
    7: 5,   # Obj 3: Convert Existing
    8: 6,   # Obj 4: Acquire New
    9: 7,   # Obj 5: Delight & Retain
}

# Agent selection heuristics based on task name/description keywords
AGENT_KEYWORDS = {
    "coder": ["implement", "build", "fix", "debug", "refactor", "ci/cd", "deploy", "api", "migration", "schema"],
    "writer": ["write", "blog", "article", "content", "copy", "draft"],
    "emailer": ["email", "sequence", "campaign", "autoresponder", "newsletter", "drip"],
    "researcher": ["research", "evaluate", "analyze", "compare", "audit", "review competitors"],
    "designer": ["design", "ui", "ux", "mockup", "wireframe", "layout", "homepage"],
    "devops": ["monitor", "backup", "infrastructure", "deploy", "ci/cd", "reliability", "disk", "server"],
    "planner": ["plan", "strategy", "roadmap", "decompose", "prioritize", "define"],
}

ESCALATION_RULES = [
    {
        "trigger": "iteration_cap",
        "description": "Task hit max iterations without passing review",
        "action": "block",
        "message": "Hit iteration cap. Reviewer notes attached. Needs Mike's direction.",
    },
    {
        "trigger": "disagreement",
        "description": "Builder and reviewer fundamentally disagree on approach",
        "action": "escalate",
        "message": "Builder and reviewer disagree. Escalating specific disagreement to Mike.",
    },
    {
        "trigger": "authority_gap",
        "description": "Task requires a decision outside Sophie's authority",
        "action": "block",
        "message": "Requires decision outside Sophie's authority (pricing, positioning, new feature). Pausing for Mike.",
    },
    {
        "trigger": "context_gap",
        "description": "Missing context file needed for quality output",
        "action": "block",
        "message": "Missing context needed for this task. Need to create context first.",
    },
]


def http_json(method: str, url: str, payload: Optional[dict] = None, timeout: int = 15) -> Any:
    headers = {"Content-Type": "application/json"}
    data = json.dumps(payload).encode("utf-8") if payload else None
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = resp.read().decode("utf-8")
        return json.loads(body) if body.strip() else None


def get_backlog_tasks(board_id: Optional[int] = None, initiative_id: Optional[int] = None) -> List[Dict]:
    """Fetch backlog tasks from MC, optionally filtered."""
    url = f"{MC_BASE}/tasks?status=backlog&assigned=true&limit=100"
    data = http_json("GET", url)
    tasks = data.get("tasks", data) if isinstance(data, dict) else data
    
    if board_id:
        tasks = [t for t in tasks if t.get("boardId") == board_id]
    if initiative_id:
        tasks = [t for t in tasks if t.get("initiativeId") == initiative_id]
    
    return tasks


def get_initiatives(board_id: int) -> List[Dict]:
    """Fetch initiatives for a board."""
    url = f"{MC_BASE}/initiatives?boardId={board_id}"
    data = http_json("GET", url)
    return data if isinstance(data, list) else data.get("initiatives", []) if isinstance(data, dict) else []


def detect_agent(task: Dict) -> str:
    """Heuristic agent selection based on task name/description."""
    text = f"{task.get('name', '')} {task.get('description', '')}".lower()
    
    scores = {}
    for agent, keywords in AGENT_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text)
        if score > 0:
            scores[agent] = score
    
    if scores:
        return max(scores, key=scores.get)
    
    # Default based on board
    board_id = task.get("boardId")
    if board_id == 2:  # Product
        return "coder"
    if board_id == 4:  # AI Systems
        return "coder"
    if board_id == 6:  # Audience
        return "writer"
    return "planner"


def detect_persona(task: Dict) -> Optional[str]:
    """Detect target persona from task context."""
    text = f"{task.get('name', '')} {task.get('description', '')}".lower()
    
    if "corporate" in text or "enterprise" in text:
        return "corporate-professional"
    if "boutique" in text or "consultancy" in text or "small firm" in text:
        return "boutique-consultancy"
    if "solo" in text or "individual" in text or "freelance" in text:
        return "solo-consultant"
    return None


def cmd_plan(args: argparse.Namespace) -> int:
    """Create an execution plan for an objective or initiative."""
    
    if args.initiative_id:
        tasks = get_backlog_tasks(initiative_id=args.initiative_id)
    elif args.board_id:
        tasks = get_backlog_tasks(board_id=args.board_id)
    else:
        # Get all backlog tasks, sorted by objective priority
        tasks = get_backlog_tasks()
        tasks.sort(key=lambda t: OBJECTIVE_PRIORITY.get(t.get("boardId", 0), 99))
    
    if not tasks:
        print(json.dumps({"action": "plan", "tasks": [], "message": "No backlog tasks found"}))
        return 0
    
    # Limit
    tasks = tasks[:args.max_tasks]
    
    plan = {
        "action": "plan",
        "createdAt": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "totalTasks": len(tasks),
        "parallelSlots": args.slots,
        "tasks": []
    }
    
    for t in tasks:
        agent = args.agent or detect_agent(t)
        persona = detect_persona(t)
        
        plan["tasks"].append({
            "taskId": t["id"],
            "name": t["name"],
            "boardId": t.get("boardId"),
            "initiativeId": t.get("initiativeId"),
            "agent": agent,
            "persona": persona,
            "priority": OBJECTIVE_PRIORITY.get(t.get("boardId", 0), 99),
            "status": "pending",
        })
    
    # Save plan
    plan_path = AI_DIR / "runs" / "plan.json"
    plan_path.parent.mkdir(parents=True, exist_ok=True)
    plan_path.write_text(json.dumps(plan, indent=2) + "\n")
    
    print(json.dumps(plan, indent=2))
    return 0


def cmd_next_batch(args: argparse.Namespace) -> int:
    """Pick the next N tasks to run in parallel from a plan."""
    plan_path = Path(args.plan_file)
    plan = json.loads(plan_path.read_text())
    
    pending = [t for t in plan["tasks"] if t["status"] == "pending"]
    batch = pending[:args.slots]
    
    for t in batch:
        t["status"] = "running"
    
    # Update plan file
    plan_path.write_text(json.dumps(plan, indent=2) + "\n")
    
    output = {
        "action": "next_batch",
        "batch": batch,
        "remaining": len(pending) - len(batch),
    }
    print(json.dumps(output, indent=2))
    return 0


def cmd_consistency(args: argparse.Namespace) -> int:
    """Generate a consistency check prompt for completed initiative outputs."""
    runs_dir = AI_DIR / "runs"
    
    outputs = []
    for task_dir in sorted(runs_dir.iterdir()):
        if not task_dir.is_dir() or not task_dir.name.isdigit():
            continue
        
        meta_file = task_dir / "meta.json"
        output_file = task_dir / "output.md"
        
        if not meta_file.exists() or not output_file.exists():
            continue
        
        meta = json.loads(meta_file.read_text())
        
        # Filter by initiative if specified
        if args.initiative_id and meta.get("initiativeId") != args.initiative_id:
            continue
        
        if meta.get("status") in ("mike_review", "done"):
            content = output_file.read_text().strip()
            if content:
                outputs.append({
                    "taskId": int(task_dir.name),
                    "name": meta.get("taskName", f"Task {task_dir.name}"),
                    "agent": meta.get("agent", "unknown"),
                    "content_preview": content[:500],
                    "content_length": len(content),
                })
    
    if len(outputs) < 2:
        print(json.dumps({"action": "consistency", "skip": True, "reason": "Fewer than 2 outputs to compare"}))
        return 0
    
    prompt = f"""# Cross-Task Consistency Check

You are reviewing {len(outputs)} completed deliverables from the same initiative.
Check for:

1. **Repetition** — Are the same examples, phrases, or ideas repeated across pieces?
2. **Tone drift** — Does the voice/tone stay consistent with SlideHeroes brand?
3. **Conflicting messaging** — Do any pieces contradict each other?
4. **Quality variance** — Are some significantly weaker than others?
5. **Gap coverage** — Together, do they cover the initiative's scope without major gaps?

## Deliverables to Review

"""
    for o in outputs:
        prompt += f"### Task {o['taskId']}: {o['name']}\n"
        prompt += f"Agent: {o['agent']} | Length: {o['content_length']} chars\n"
        prompt += f"Preview:\n{o['content_preview']}\n\n---\n\n"
    
    prompt += """
## Required Output

For each issue found, specify:
- Which tasks are affected
- What the issue is
- Suggested fix

If everything looks consistent, say "CONSISTENT — no issues found."
"""
    
    check_path = runs_dir / "consistency-check.md"
    check_path.write_text(prompt)
    
    print(json.dumps({
        "action": "consistency",
        "outputCount": len(outputs),
        "promptFile": str(check_path),
        "taskIds": [o["taskId"] for o in outputs],
    }, indent=2))
    return 0


def cmd_escalate(args: argparse.Namespace) -> int:
    """Check a task for escalation triggers."""
    rdir = AI_DIR / "runs" / str(args.task_id)
    meta_file = rdir / "meta.json"
    
    if not meta_file.exists():
        print(json.dumps({"action": "escalate", "taskId": args.task_id, "trigger": "no_meta", "recommendation": "No run metadata found. Task may not have been started via loop runner."}))
        return 0
    
    meta = json.loads(meta_file.read_text())
    
    triggers_found = []
    
    # Check iteration cap
    iteration = meta.get("iteration", 0)
    max_iter = meta.get("maxIterations", 3)
    if iteration >= max_iter and meta.get("verdict") == "FAIL":
        triggers_found.append({
            "rule": "iteration_cap",
            "detail": f"Hit {iteration}/{max_iter} iterations without passing",
            "action": ESCALATION_RULES[0]["action"],
            "message": ESCALATION_RULES[0]["message"],
        })
    
    # Check for review disagreement (heuristic: multiple FAILs with different reasons)
    learnings_file = rdir / "learnings.md"
    if learnings_file.exists():
        learnings = learnings_file.read_text()
        if learnings.count("## Iteration") >= 2:
            # Multiple review rounds — check if issues are recurring vs new each time
            triggers_found.append({
                "rule": "possible_disagreement",
                "detail": f"Multiple review iterations with ongoing issues",
                "action": "review",
                "message": "Builder may be stuck in a loop. Review learnings to determine if escalation needed.",
            })
    
    # Check blocked status
    if meta.get("status") == "blocked":
        triggers_found.append({
            "rule": "already_blocked",
            "detail": meta.get("blockedReason", "No reason given"),
            "action": "escalate",
            "message": "Task is already blocked. Needs Mike's input.",
        })
    
    output = {
        "action": "escalate",
        "taskId": args.task_id,
        "iteration": iteration,
        "maxIterations": max_iter,
        "status": meta.get("status"),
        "verdict": meta.get("verdict"),
        "triggers": triggers_found,
        "recommendation": "escalate" if triggers_found else "continue",
    }
    print(json.dumps(output, indent=2))
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="orchestrator.py", description="Sophie Loop Orchestrator")
    sub = p.add_subparsers(dest="cmd", required=True)
    
    sp1 = sub.add_parser("plan", help="Create execution plan from MC backlog")
    sp1.add_argument("--board-id", type=int, help="Filter by board (objective)")
    sp1.add_argument("--initiative-id", type=int, help="Filter by initiative")
    sp1.add_argument("--agent", help="Override agent for all tasks")
    sp1.add_argument("--max-tasks", type=int, default=10, help="Max tasks in plan (default: 10)")
    sp1.add_argument("--slots", type=int, default=3, help="Parallel slots (default: 3)")
    sp1.set_defaults(func=cmd_plan)
    
    sp2 = sub.add_parser("next-batch", help="Pick next N tasks from plan")
    sp2.add_argument("--plan-file", default=str(AI_DIR / "runs" / "plan.json"))
    sp2.add_argument("--slots", type=int, default=3)
    sp2.set_defaults(func=cmd_next_batch)
    
    sp3 = sub.add_parser("consistency", help="Generate consistency check prompt")
    sp3.add_argument("--initiative-id", type=int, help="Filter by initiative")
    sp3.set_defaults(func=cmd_consistency)
    
    sp4 = sub.add_parser("escalate", help="Check task for escalation triggers")
    sp4.add_argument("--task-id", type=int, required=True)
    sp4.set_defaults(func=cmd_escalate)
    
    return p


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    return int(args.func(args) or 0)


if __name__ == "__main__":
    raise SystemExit(main())
