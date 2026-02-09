#!/usr/bin/env python3
"""Sophie Loop Runner (coordination tool)

This script prepares prompts + metadata for the builder→reviewer iteration loop.
It does NOT spawn agents. The main Sophie session is responsible for spawning
builder/reviewer runs and feeding outputs back into this tool.

Commands:
  prepare         -> build builder prompt.md for the current iteration
  review-prep     -> save builder output.md, run checks, build review prompt
  process-review  -> save review.md, parse PASS/FAIL, update MC, iterate/block

See README-loop-runner.md for usage.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import subprocess
import sys
import textwrap
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import yaml
import urllib.request


MC_DEFAULT_BASE = "http://localhost:3001/api/v1"


def utc_now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()


def eprint(*args: Any) -> None:
    print(*args, file=sys.stderr)


def die(msg: str, code: int = 2) -> None:
    eprint(f"ERROR: {msg}")
    raise SystemExit(code)


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError:
        die(f"Missing file: {path}")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def load_yaml(path: Path) -> Dict[str, Any]:
    data = yaml.safe_load(read_text(path))
    if not isinstance(data, dict):
        die(f"YAML root must be a mapping: {path}")
    return data


def http_json(method: str, url: str, payload: Optional[dict] = None, timeout: int = 10) -> Any:
    headers = {"Content-Type": "application/json"}
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = resp.read().decode("utf-8")
        if not body.strip():
            return None
        return json.loads(body)


def mc_get_task(mc_base: str, task_id: int) -> Dict[str, Any]:
    url = f"{mc_base}/tasks/{task_id}"
    data = http_json("GET", url)
    if not isinstance(data, dict):
        die(f"Unexpected MC response for GET {url}")
    return data


def mc_patch_task(mc_base: str, task_id: int, patch: Dict[str, Any], dry_run: bool) -> None:
    if dry_run:
        eprint(f"[dry-run] MC PATCH tasks/{task_id}: {json.dumps(patch, ensure_ascii=False)}")
        return
    url = f"{mc_base}/tasks/{task_id}"
    http_json("PATCH", url, patch)


def expanduser(path: str) -> Path:
    return Path(os.path.expanduser(path)).resolve()


def run_dir(base: Path, task_id: int) -> Path:
    return base / "runs" / str(task_id)


def meta_path(rdir: Path) -> Path:
    return rdir / "meta.json"


def load_meta(rdir: Path) -> Dict[str, Any]:
    p = meta_path(rdir)
    if not p.exists():
        return {
            "taskId": None,
            "agent": None,
            "persona": None,
            "iteration": 0,
            "createdAt": utc_now_iso(),
            "updatedAt": utc_now_iso(),
            "status": None,
            "checks": {},
        }
    data = json.loads(read_text(p))
    if not isinstance(data, dict):
        die(f"meta.json is not an object: {p}")
    return data


def save_meta(rdir: Path, meta: Dict[str, Any]) -> None:
    meta["updatedAt"] = utc_now_iso()
    write_text(meta_path(rdir), json.dumps(meta, indent=2, ensure_ascii=False) + "\n")


def load_agent_profile(ai_dir: Path, agent: str) -> Dict[str, Any]:
    path = ai_dir / "agents" / f"{agent}.yaml"
    prof = load_yaml(path)
    # minimal validation
    for k in ["model", "context_mapping", "system_prompt", "max_iterations"]:
        if k not in prof:
            die(f"Agent profile missing '{k}': {path}")
    return prof


def load_context_bundle(ai_dir: Path, context_mapping: str, persona: Optional[str]) -> Tuple[str, List[str]]:
    mappings = load_yaml(ai_dir / "contexts" / "skill-mappings.yaml")
    if context_mapping not in mappings:
        die(f"Unknown context_mapping '{context_mapping}' (not in skill-mappings.yaml)")

    m = mappings[context_mapping]
    if not isinstance(m, dict):
        die(f"Invalid mapping for {context_mapping}: expected dict")

    files: List[str] = []

    always = m.get("always", [])
    if always:
        if not isinstance(always, list):
            die(f"{context_mapping}.always must be a list")
        files.extend(always)

    per_persona = m.get("per-persona", {})
    if persona and per_persona:
        if not isinstance(per_persona, dict):
            die(f"{context_mapping}.per-persona must be a dict")
        persona_files = per_persona.get(persona)
        if persona_files:
            if not isinstance(persona_files, list):
                die(f"{context_mapping}.per-persona.{persona} must be a list")
            files.extend(persona_files)

    # de-dupe preserving order
    seen = set()
    unique_files = []
    for f in files:
        if f not in seen:
            seen.add(f)
            unique_files.append(f)

    parts: List[str] = []
    resolved: List[str] = []
    for rel in unique_files:
        p = (ai_dir / "contexts" / rel).resolve()
        if not p.exists():
            die(f"Context file not found: {p} (from mapping {context_mapping})")
        resolved.append(str(p))
        content = read_text(p).rstrip()
        parts.append(f"\n\n---\n\n# Context: {rel}\n\n{content}\n")

    bundle = "".join(parts).lstrip("\n")
    return bundle, resolved


def ensure_run_files(rdir: Path) -> None:
    rdir.mkdir(parents=True, exist_ok=True)
    for name in ["prompt.md", "output.md", "review.md", "learnings.md", "checks.log"]:
        p = rdir / name
        if not p.exists():
            write_text(p, "")


def sanitize_task_text(task: Dict[str, Any]) -> str:
    # MC schema may vary; best-effort extract
    name = str(task.get("name", "")).strip()
    desc = str(task.get("description", "") or task.get("notes", "") or "").strip()
    pieces = []
    if name:
        pieces.append(f"# Task\n\n{name}\n")
    if desc:
        pieces.append(f"\n## Description\n\n{desc}\n")
    if not pieces:
        pieces.append("# Task\n\n(Unable to extract task name/description from Mission Control payload.)\n")
    return "\n".join(pieces).rstrip() + "\n"


def assemble_builder_prompt(*, system_prompt: str, context_bundle: str, task_text: str, learnings: str, iteration: int) -> str:
    learnings_block = ""
    if iteration > 1 and learnings.strip():
        learnings_block = textwrap.dedent(
            f"""
            \n\n---\n\n# Learnings From Prior Review Iterations\n\n{learnings.strip()}\n"""
        )

    return textwrap.dedent(
        f"""\
        # Builder System Prompt\n\n{system_prompt.strip()}\n\n---\n\n# Context Bundle\n\n{context_bundle.rstrip()}\n\n---\n\n{task_text.rstrip()}\n{learnings_block}\n\n---\n\n# Output Instructions\n- Produce the final deliverable only (no analysis).\n- Use Markdown unless the task explicitly requires another format.\n"""
    ).rstrip() + "\n"


def assemble_review_prompt(*, reviewer_system_prompt: str, context_bundle: str, builder_output: str, review_criteria: List[str]) -> str:
    crit = "\n".join([f"- {c}" for c in review_criteria]) if review_criteria else "- (No criteria provided)"
    return textwrap.dedent(
        f"""\
        # Reviewer System Prompt\n\n{reviewer_system_prompt.strip()}\n\n---\n\n# Context Bundle (same as builder)\n\n{context_bundle.rstrip()}\n\n---\n\n# Builder Output To Review\n\n{builder_output.rstrip()}\n\n---\n\n# Review Criteria\n{crit}\n\n---\n\n# Required Output\nReturn either PASS or FAIL as specified in your system prompt.\n"""
    ).rstrip() + "\n"


def detect_task_type(agent_profile: Dict[str, Any]) -> str:
    cm = str(agent_profile.get("context_mapping", "")).strip().lower()
    if cm in {"coding"}:
        return "coding"
    if cm in {"research"}:
        return "research"
    if cm in {"design"}:
        return "design"
    # default bucket for most writing/email/social
    return "content"


def check_content(builder_output: str, min_words: int = 300) -> Tuple[bool, str]:
    words = re.findall(r"\b\w+\b", builder_output)
    wc = len(words)
    has_heading = bool(re.search(r"^\s*#\s+.+", builder_output, flags=re.M))
    has_cta = bool(re.search(r"\b(CTA|call to action|book\s+a\s+call|schedule\s+a\s+call|get\s+in\s+touch|SlideHeroes)\b", builder_output, flags=re.I))

    ok = (wc >= min_words) and has_heading and has_cta
    details = {
        "wordCount": wc,
        "minWords": min_words,
        "hasHeading": has_heading,
        "hasCTA": has_cta,
    }
    report = "Content checks:\n" + "\n".join([f"- {k}: {v}" for k, v in details.items()])
    return ok, report


def check_research(builder_output: str) -> Tuple[bool, str]:
    ok = len(builder_output.strip()) > 0
    return ok, f"Research checks:\n- nonEmptyOutput: {ok}\n- charCount: {len(builder_output)}"


def run_coding_checks(repo_root: Path) -> Tuple[bool, str]:
    # Run in a shell so pnpm is resolved as in normal environments.
    cmd = "pnpm typecheck && pnpm lint"
    try:
        p = subprocess.run(cmd, cwd=str(repo_root), shell=True, capture_output=True, text=True)
    except Exception as ex:
        return False, f"Coding checks: FAILED to execute ({ex})"

    ok = p.returncode == 0
    out = (p.stdout or "") + ("\n" + p.stderr if p.stderr else "")
    report = f"Coding checks ({cmd}) => {'PASS' if ok else 'FAIL'}\n\n{out.strip()}\n"
    return ok, report


def parse_verdict(review_text: str) -> str:
    # Prefer explicit "Review Result" header, otherwise first PASS/FAIL.
    m = re.search(r"Review\s*Result\s*:\s*(PASS|FAIL)", review_text, flags=re.I)
    if m:
        return m.group(1).upper()

    head = review_text.strip()[:2000]
    # If both appear, prefer FAIL.
    if re.search(r"\bFAIL\b", head, flags=re.I):
        return "FAIL"
    if re.search(r"\bPASS\b", head, flags=re.I):
        return "PASS"
    return "UNKNOWN"


def summarize_review(review_text: str, max_len: int = 280) -> str:
    txt = re.sub(r"\s+", " ", review_text.strip())
    if len(txt) <= max_len:
        return txt
    return txt[: max_len - 1].rstrip() + "…"


def cmd_prepare(args: argparse.Namespace) -> int:
    ai_dir = expanduser(args.ai_dir)
    rdir = run_dir(ai_dir, args.task_id)
    ensure_run_files(rdir)

    agent_profile = load_agent_profile(ai_dir, args.agent)
    context_mapping = str(agent_profile["context_mapping"])

    try:
        task = mc_get_task(args.mc_base, args.task_id)
    except Exception as ex:
        if args.dry_run:
            eprint(f"[dry-run] Warning: failed to fetch task from Mission Control ({ex}). Using placeholder task text.")
            task = {"name": f"Task {args.task_id}", "description": "(Mission Control unavailable during dry-run.)"}
        else:
            raise
    task_text = sanitize_task_text(task)

    meta = load_meta(rdir)
    iteration = int(meta.get("iteration", 0) or 0)
    iteration = max(iteration, 0) + 1

    context_bundle, resolved_files = load_context_bundle(ai_dir, context_mapping, args.persona)
    learnings = read_text(rdir / "learnings.md")

    prompt = assemble_builder_prompt(
        system_prompt=str(agent_profile["system_prompt"]),
        context_bundle=context_bundle,
        task_text=task_text,
        learnings=learnings,
        iteration=iteration,
    )

    write_text(rdir / "prompt.md", prompt)

    meta.update(
        {
            "taskId": args.task_id,
            "agent": args.agent,
            "persona": args.persona,
            "iteration": iteration,
            "contextMapping": context_mapping,
            "builderModel": agent_profile.get("model"),
            "builderThinking": agent_profile.get("thinking"),
            "contextFiles": resolved_files,
            "status": "prompt_prepared",
            "taskType": args.task_type or detect_task_type(agent_profile),
            "maxIterations": int(agent_profile.get("max_iterations", 1) or 1),
            "lastPrepareAt": utc_now_iso(),
        }
    )
    save_meta(rdir, meta)

    if args.update_status:
        mc_patch_task(args.mc_base, args.task_id, {"status": "in_progress"}, args.dry_run)

    if args.dry_run:
        print("=== DRY RUN: Context bundle preview (first 2000 chars) ===")
        print(context_bundle[:2000])
        print("\n=== Builder prompt path ===")
        print(str((rdir / "prompt.md").resolve()))
        return 0

    # Output instructions for Sophie (main session)
    out = {
        "action": "spawn_builder",
        "taskId": args.task_id,
        "agent": args.agent,
        "persona": args.persona,
        "iteration": iteration,
        "model": agent_profile.get("model"),
        "thinking": agent_profile.get("thinking"),
        "promptFile": str((rdir / "prompt.md").resolve()),
        "runDir": str(rdir.resolve()),
    }
    print(json.dumps(out, indent=2))
    return 0


def cmd_review_prep(args: argparse.Namespace) -> int:
    ai_dir = expanduser(args.ai_dir)
    rdir = run_dir(ai_dir, args.task_id)
    ensure_run_files(rdir)

    meta = load_meta(rdir)
    agent = args.agent or meta.get("agent")
    if not agent:
        die("Agent not provided and not present in meta.json. Run 'prepare' first or pass --agent.")

    agent_profile = load_agent_profile(ai_dir, str(agent))

    builder_output = read_text(expanduser(args.output_file))
    write_text(rdir / "output.md", builder_output)

    # checks
    task_type = args.task_type or meta.get("taskType") or detect_task_type(agent_profile)
    checks_ok = True
    checks_report = ""

    if task_type == "coding":
        repo_root = Path(args.repo_root).resolve() if args.repo_root else Path("/home/ubuntu/clawd").resolve()
        checks_ok, checks_report = run_coding_checks(repo_root)
    elif task_type == "research":
        checks_ok, checks_report = check_research(builder_output)
    else:
        # content/design
        checks_ok, checks_report = check_content(builder_output, min_words=int(args.min_words))

    write_text(rdir / "checks.log", checks_report.rstrip() + "\n")

    # update task status
    if args.update_status:
        mc_patch_task(args.mc_base, args.task_id, {"status": "sophie_review"}, args.dry_run)

    # build review prompt
    reviewer_profile = load_agent_profile(ai_dir, args.reviewer_agent)

    context_mapping = meta.get("contextMapping") or agent_profile.get("context_mapping")
    persona = args.persona or meta.get("persona")
    context_bundle, resolved_files = load_context_bundle(ai_dir, str(context_mapping), str(persona) if persona else None)

    criteria = agent_profile.get("review_criteria", [])
    if criteria is None:
        criteria = []
    if not isinstance(criteria, list):
        die("agent_profile.review_criteria must be a list")

    review_prompt = assemble_review_prompt(
        reviewer_system_prompt=str(reviewer_profile["system_prompt"]),
        context_bundle=context_bundle,
        builder_output=builder_output,
        review_criteria=[str(c) for c in criteria],
    )

    review_prompt_path = rdir / "review-prompt.md"
    write_text(review_prompt_path, review_prompt)

    meta.update(
        {
            "agent": str(agent),
            "persona": persona,
            "contextFiles": resolved_files,
            "status": "review_prompt_prepared",
            "checks": {
                "taskType": task_type,
                "passed": bool(checks_ok),
                "reportFile": str((rdir / "checks.log").resolve()),
            },
            "lastReviewPrepAt": utc_now_iso(),
        }
    )
    save_meta(rdir, meta)

    out = {
        "action": "spawn_reviewer",
        "taskId": args.task_id,
        "reviewerAgent": args.reviewer_agent,
        "model": reviewer_profile.get("model"),
        "thinking": reviewer_profile.get("thinking"),
        "promptFile": str(review_prompt_path.resolve()),
        "runDir": str(rdir.resolve()),
        "checks": {"passed": checks_ok, "taskType": task_type, "reportFile": str((rdir / "checks.log").resolve())},
    }
    print(json.dumps(out, indent=2))
    return 0


def cmd_process_review(args: argparse.Namespace) -> int:
    ai_dir = expanduser(args.ai_dir)
    rdir = run_dir(ai_dir, args.task_id)
    ensure_run_files(rdir)

    meta = load_meta(rdir)
    agent = args.agent or meta.get("agent")
    if not agent:
        die("Agent not provided and not present in meta.json.")

    agent_profile = load_agent_profile(ai_dir, str(agent))
    max_iter = int(agent_profile.get("max_iterations", 1) or 1)

    review_text = read_text(expanduser(args.review_file))
    write_text(rdir / "review.md", review_text)

    verdict = parse_verdict(review_text)
    iteration = int(meta.get("iteration", 1) or 1)

    if verdict == "PASS":
        summary = args.review_summary or f"Passed on iteration {iteration}. {summarize_review(review_text)}"
        mc_patch_task(
            args.mc_base,
            args.task_id,
            {"status": "mike_review", "reviewSummary": summary},
            args.dry_run,
        )
        meta.update({"status": "mike_review", "verdict": "PASS", "reviewSummary": summary, "lastProcessReviewAt": utc_now_iso()})
        save_meta(rdir, meta)
        print("PASS")
        return 0

    if verdict == "FAIL":
        # append reviewer notes to learnings
        learnings_path = rdir / "learnings.md"
        old = read_text(learnings_path)
        addition = textwrap.dedent(
            f"""\
            \n\n---\n\n## Iteration {iteration} Review Notes ({utc_now_iso()})\n\n{review_text.strip()}\n"""
        )
        write_text(learnings_path, (old.rstrip() + addition + "\n").lstrip("\n"))

        next_iter = iteration + 1
        if next_iter <= max_iter:
            meta.update({"status": "iterate", "verdict": "FAIL", "lastProcessReviewAt": utc_now_iso()})
            save_meta(rdir, meta)
            print("FAIL:iterate")
            return 0

        # iteration cap hit
        reason = f"Hit iteration cap ({max_iter}). Reviewer notes: {summarize_review(review_text, 400)}"
        mc_patch_task(args.mc_base, args.task_id, {"blockedReason": reason}, args.dry_run)
        meta.update({"status": "blocked", "verdict": "FAIL", "blockedReason": reason, "lastProcessReviewAt": utc_now_iso()})
        save_meta(rdir, meta)
        print("FAIL:blocked")
        return 0

    # unknown verdict
    meta.update({"status": "review_verdict_unknown", "verdict": verdict, "lastProcessReviewAt": utc_now_iso()})
    save_meta(rdir, meta)
    die("Could not parse PASS/FAIL from reviewer output.")


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="loop-runner.py")
    p.add_argument("--ai-dir", default="~/clawd/.ai", help="AI workspace directory (default: ~/clawd/.ai)")
    p.add_argument("--mc-base", default=MC_DEFAULT_BASE, help=f"Mission Control API base (default: {MC_DEFAULT_BASE})")
    sub = p.add_subparsers(dest="cmd", required=True)

    sp = sub.add_parser("prepare", help="Prepare builder prompt")
    sp.add_argument("--dry-run", action="store_true", help="Do not PATCH Mission Control")
    sp.add_argument("--task-id", type=int, required=True)
    sp.add_argument("--agent", required=True, help="Builder agent key (e.g., writer, coder)")
    sp.add_argument("--persona", default=None, help="Persona key (e.g., solo-consultant)")
    sp.add_argument("--task-type", default=None, choices=["coding", "content", "research", "design"], help="Override task type")
    sp.add_argument("--update-status", action="store_true", help="PATCH task status to in_progress")
    sp.set_defaults(func=cmd_prepare)

    sp2 = sub.add_parser("review-prep", help="Save builder output, run checks, and prepare reviewer prompt")
    sp2.add_argument("--dry-run", action="store_true", help="Do not PATCH Mission Control")
    sp2.add_argument("--task-id", type=int, required=True)
    sp2.add_argument("--output-file", required=True, help="Path to builder output text/markdown")
    sp2.add_argument("--agent", default=None, help="Builder agent key (optional if prepare already run)")
    sp2.add_argument("--persona", default=None, help="Persona key (optional if prepare already run)")
    sp2.add_argument("--reviewer-agent", default="reviewer", help="Reviewer agent profile key (default: reviewer)")
    sp2.add_argument("--task-type", default=None, choices=["coding", "content", "research", "design"], help="Override task type")
    sp2.add_argument("--repo-root", default=None, help="Repo root for coding checks (default: /home/ubuntu/clawd)")
    sp2.add_argument("--min-words", type=int, default=300, help="Min word count for content checks (default: 300)")
    sp2.add_argument("--update-status", action="store_true", help="PATCH task status to sophie_review")
    sp2.set_defaults(func=cmd_review_prep)

    sp3 = sub.add_parser("process-review", help="Save review output and decide next step")
    sp3.add_argument("--dry-run", action="store_true", help="Do not PATCH Mission Control")
    sp3.add_argument("--task-id", type=int, required=True)
    sp3.add_argument("--review-file", required=True, help="Path to reviewer output text/markdown")
    sp3.add_argument("--agent", default=None, help="Builder agent key (optional if prepare already run)")
    sp3.add_argument("--review-summary", default=None, help="Optional custom review summary for Mission Control")
    sp3.set_defaults(func=cmd_process_review)

    return p


def main(argv: Optional[List[str]] = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return int(args.func(args) or 0)


if __name__ == "__main__":
    raise SystemExit(main())
