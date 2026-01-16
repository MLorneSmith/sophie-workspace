#!/usr/bin/env python3
"""
validate-dependencies.py

Validates task dependencies and computes execution metrics:
- Cycle detection (topological sort)
- Critical path calculation
- Parallel group computation
- Slack analysis

Usage:
    ./validate-dependencies.py <tasks.json>
    ./validate-dependencies.py .ai/alpha/specs/1333-foo/1335-bar/1340-baz/tasks.json

Output (JSON):
    {
        "valid": true,
        "checks": {
            "no_cycles": true,
            "all_documented": true,
            "spikes_first": true,
            "critical_path_valid": true
        },
        "critical_path": {
            "task_ids": ["S1", "T1", "T3", "T6", "T7"],
            "total_hours": 15
        },
        "parallel_groups": [...],
        "duration": {
            "sequential": 21,
            "parallel": 16,
            "time_saved_percent": 24
        },
        "errors": []
    }
"""

import json
import sys
from collections import defaultdict, deque
from typing import Any


def load_tasks(filepath: str) -> dict[str, Any]:
    """Load tasks.json file."""
    with open(filepath) as f:
        return json.load(f)


def build_graph(tasks: list[dict]) -> tuple[dict[str, list[str]], dict[str, list[str]], dict[str, float]]:
    """
    Build adjacency lists and task hours map.

    Returns:
        - graph: task_id -> list of tasks it blocks
        - reverse_graph: task_id -> list of tasks that block it
        - hours: task_id -> estimated hours
    """
    graph: dict[str, list[str]] = defaultdict(list)
    reverse_graph: dict[str, list[str]] = defaultdict(list)
    hours: dict[str, float] = {}

    for task in tasks:
        task_id = task["id"]
        hours[task_id] = task.get("estimated_hours", 0)

        # Initialize empty lists
        if task_id not in graph:
            graph[task_id] = []

        # blocked_by means this task depends on those tasks
        blocked_by = task.get("dependencies", {}).get("blocked_by", [])
        for blocker in blocked_by:
            graph[blocker].append(task_id)
            reverse_graph[task_id].append(blocker)

    return dict(graph), dict(reverse_graph), hours


def detect_cycles(graph: dict[str, list[str]], tasks: list[dict]) -> tuple[bool, list[str]]:
    """
    Detect cycles using Kahn's algorithm (topological sort).

    Returns:
        - has_cycle: True if cycle detected
        - cycle_path: List of task IDs in the cycle (if found)
    """
    all_nodes = set(t["id"] for t in tasks)
    in_degree: dict[str, int] = defaultdict(int)

    for node in all_nodes:
        in_degree[node] = 0

    for node, neighbors in graph.items():
        for neighbor in neighbors:
            in_degree[neighbor] += 1

    # Start with nodes that have no incoming edges
    queue = deque([n for n in all_nodes if in_degree[n] == 0])
    sorted_nodes = []

    while queue:
        node = queue.popleft()
        sorted_nodes.append(node)

        for neighbor in graph.get(node, []):
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    # If we couldn't sort all nodes, there's a cycle
    if len(sorted_nodes) != len(all_nodes):
        # Find nodes involved in cycle
        remaining = all_nodes - set(sorted_nodes)
        return True, list(remaining)

    return False, []


def compute_critical_path(
    graph: dict[str, list[str]],
    reverse_graph: dict[str, list[str]],
    hours: dict[str, float],
    tasks: list[dict]
) -> tuple[list[str], float]:
    """
    Compute critical path using longest path algorithm.

    Returns:
        - path: List of task IDs on critical path
        - total_hours: Sum of hours on critical path
    """
    all_nodes = set(t["id"] for t in tasks)

    # Find root nodes (no dependencies)
    roots = [n for n in all_nodes if not reverse_graph.get(n)]

    # Compute earliest start time for each node
    earliest_start: dict[str, float] = {}
    earliest_finish: dict[str, float] = {}
    predecessor: dict[str, str | None] = {}

    # Topological order
    in_degree: dict[str, int] = defaultdict(int)
    for node, neighbors in graph.items():
        for neighbor in neighbors:
            in_degree[neighbor] += 1

    queue = deque(roots)
    topo_order = []

    while queue:
        node = queue.popleft()
        topo_order.append(node)
        for neighbor in graph.get(node, []):
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    # Forward pass - compute earliest times
    for node in topo_order:
        deps = reverse_graph.get(node, [])
        if not deps:
            earliest_start[node] = 0
            predecessor[node] = None
        else:
            max_finish = 0
            max_pred = None
            for dep in deps:
                if earliest_finish.get(dep, 0) > max_finish:
                    max_finish = earliest_finish[dep]
                    max_pred = dep
            earliest_start[node] = max_finish
            predecessor[node] = max_pred

        earliest_finish[node] = earliest_start[node] + hours.get(node, 0)

    # Find the node with maximum earliest_finish (end of critical path)
    if not earliest_finish:
        return [], 0

    end_node = max(earliest_finish, key=lambda n: earliest_finish[n])
    total_hours = earliest_finish[end_node]

    # Trace back to find critical path
    path = []
    current = end_node
    while current is not None:
        path.append(current)
        current = predecessor.get(current)

    path.reverse()
    return path, total_hours


def compute_parallel_groups(
    graph: dict[str, list[str]],
    reverse_graph: dict[str, list[str]],
    hours: dict[str, float],
    tasks: list[dict]
) -> list[dict]:
    """
    Compute parallel execution groups.
    Group N contains tasks whose dependencies are ALL in groups < N.

    Returns:
        List of groups with task_ids, estimated_hours, parallel_hours
    """
    all_nodes = set(t["id"] for t in tasks)
    task_types = {t["id"]: t.get("type", "task") for t in tasks}

    # Assign groups
    node_group: dict[str, int] = {}

    # Group 0: Spikes (always first) + tasks with no dependencies
    group_0_nodes = []
    for node in all_nodes:
        if task_types[node] == "spike":
            node_group[node] = 0
            group_0_nodes.append(node)
        elif not reverse_graph.get(node):
            node_group[node] = 0
            group_0_nodes.append(node)

    # Remaining nodes - assign based on dependencies
    remaining = all_nodes - set(node_group.keys())
    changed = True

    while remaining and changed:
        changed = False
        for node in list(remaining):
            deps = reverse_graph.get(node, [])
            if all(d in node_group for d in deps):
                # All dependencies have groups, assign to max + 1
                max_dep_group = max(node_group[d] for d in deps) if deps else -1
                node_group[node] = max_dep_group + 1
                remaining.remove(node)
                changed = True

    # Build group structure
    groups_dict: dict[int, list[str]] = defaultdict(list)
    for node, group in node_group.items():
        groups_dict[group].append(node)

    groups = []
    for group_id in sorted(groups_dict.keys()):
        task_ids = groups_dict[group_id]

        # Calculate hours
        total_hours = sum(hours.get(t, 0) for t in task_ids)
        parallel_hours = max(hours.get(t, 0) for t in task_ids) if task_ids else 0

        # Determine group name
        if group_id == 0:
            name = "Spikes" if any(task_types[t] == "spike" for t in task_ids) else "Foundation"
        else:
            name = f"Group {group_id}"

        groups.append({
            "id": group_id,
            "name": name,
            "task_ids": sorted(task_ids),
            "depends_on_groups": list(range(group_id)) if group_id > 0 else [],
            "estimated_hours": total_hours,
            "parallel_hours": parallel_hours
        })

    return groups


def validate_spikes_first(tasks: list[dict], groups: list[dict]) -> bool:
    """Check that all spikes are in group 0."""
    spike_ids = {t["id"] for t in tasks if t.get("type") == "spike"}

    if not spike_ids:
        return True  # No spikes, validation passes

    group_0 = next((g for g in groups if g["id"] == 0), None)
    if not group_0:
        return False

    return spike_ids.issubset(set(group_0["task_ids"]))


def validate_all_documented(tasks: list[dict]) -> tuple[bool, list[str]]:
    """Check that all dependency references exist."""
    all_ids = {t["id"] for t in tasks}
    errors = []

    for task in tasks:
        deps = task.get("dependencies", {})
        for blocked_by in deps.get("blocked_by", []):
            if blocked_by not in all_ids:
                errors.append(f"Task {task['id']} references unknown blocker: {blocked_by}")
        for blocks in deps.get("blocks", []):
            if blocks not in all_ids:
                errors.append(f"Task {task['id']} references unknown blocked task: {blocks}")

    return len(errors) == 0, errors


def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "valid": False,
            "errors": ["Usage: validate-dependencies.py <tasks.json>"]
        }))
        sys.exit(1)

    filepath = sys.argv[1]

    try:
        data = load_tasks(filepath)
    except FileNotFoundError:
        print(json.dumps({
            "valid": False,
            "errors": [f"File not found: {filepath}"]
        }))
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(json.dumps({
            "valid": False,
            "errors": [f"Invalid JSON: {e}"]
        }))
        sys.exit(1)

    tasks = data.get("tasks", [])
    if not tasks:
        print(json.dumps({
            "valid": True,
            "checks": {
                "no_cycles": True,
                "all_documented": True,
                "spikes_first": True,
                "critical_path_valid": True
            },
            "critical_path": {"task_ids": [], "total_hours": 0},
            "parallel_groups": [],
            "duration": {"sequential": 0, "parallel": 0, "time_saved_percent": 0},
            "errors": []
        }))
        sys.exit(0)

    errors = []

    # Build graph
    graph, reverse_graph, hours = build_graph(tasks)

    # Check 1: Cycle detection
    has_cycle, cycle_nodes = detect_cycles(graph, tasks)
    if has_cycle:
        errors.append(f"Circular dependency detected involving: {', '.join(cycle_nodes)}")

    # Check 2: All dependencies documented
    all_documented, doc_errors = validate_all_documented(tasks)
    errors.extend(doc_errors)

    # Compute metrics (only if no cycles)
    if not has_cycle:
        critical_path, critical_hours = compute_critical_path(graph, reverse_graph, hours, tasks)
        groups = compute_parallel_groups(graph, reverse_graph, hours, tasks)

        # Check 3: Spikes first
        spikes_first = validate_spikes_first(tasks, groups)
        if not spikes_first:
            errors.append("Not all spikes are in Group 0")

        # Duration analysis
        sequential = sum(hours.values())
        parallel = sum(g["parallel_hours"] for g in groups)
        time_saved = ((sequential - parallel) / sequential * 100) if sequential > 0 else 0

        result = {
            "valid": len(errors) == 0,
            "checks": {
                "no_cycles": not has_cycle,
                "all_documented": all_documented,
                "spikes_first": spikes_first,
                "critical_path_valid": len(critical_path) > 0 or len(tasks) == 0
            },
            "critical_path": {
                "task_ids": critical_path,
                "total_hours": critical_hours
            },
            "parallel_groups": groups,
            "duration": {
                "sequential": sequential,
                "parallel": parallel,
                "time_saved_percent": round(time_saved, 1)
            },
            "errors": errors
        }
    else:
        result = {
            "valid": False,
            "checks": {
                "no_cycles": False,
                "all_documented": all_documented,
                "spikes_first": False,
                "critical_path_valid": False
            },
            "critical_path": {"task_ids": [], "total_hours": 0},
            "parallel_groups": [],
            "duration": {"sequential": 0, "parallel": 0, "time_saved_percent": 0},
            "errors": errors
        }

    print(json.dumps(result, indent=2))
    sys.exit(0 if result["valid"] else 1)


if __name__ == "__main__":
    main()
