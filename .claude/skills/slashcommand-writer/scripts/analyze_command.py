#!/usr/bin/env python3
"""
Slash Command Deep Analyzer

Performs comprehensive analysis of Claude Code slash commands for improvement.
Goes beyond validation to identify best practice violations and suggest fixes.

Usage:
    python analyze_command.py <command-file.md>
    python analyze_command.py <command-file.md> --json
    python analyze_command.py <command-file.md> --brief

Exit Codes:
    0  - Analysis complete, no critical issues
    1  - Error (file not found, parse error)
    2  - Critical issues found
    10 - High-severity issues found
    20 - Medium-severity issues found (warnings only)
"""

import sys
import re
import argparse
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional
from enum import Enum


class Severity(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class CommandType(Enum):
    PLANNING = "planning"
    EXECUTION = "execution"
    UTILITY = "utility"
    ROUTING = "routing"
    ORCHESTRATION = "orchestration"
    UNKNOWN = "unknown"


@dataclass
class Issue:
    """Represents an issue found in analysis."""
    severity: Severity
    category: str
    message: str
    suggestion: str
    current_value: Optional[str] = None
    recommended_value: Optional[str] = None


@dataclass
class AnalysisResult:
    """Result of deep command analysis."""
    command_name: str
    command_type: CommandType
    file_path: str
    issues: list[Issue] = field(default_factory=list)
    scores: dict = field(default_factory=dict)
    recommendations: list[str] = field(default_factory=list)

    @property
    def critical_count(self) -> int:
        return sum(1 for i in self.issues if i.severity == Severity.CRITICAL)

    @property
    def high_count(self) -> int:
        return sum(1 for i in self.issues if i.severity == Severity.HIGH)

    @property
    def medium_count(self) -> int:
        return sum(1 for i in self.issues if i.severity == Severity.MEDIUM)

    @property
    def low_count(self) -> int:
        return sum(1 for i in self.issues if i.severity == Severity.LOW)

    @property
    def overall_score(self) -> int:
        """Calculate overall quality score (0-100)."""
        base_score = 100
        base_score -= self.critical_count * 30
        base_score -= self.high_count * 15
        base_score -= self.medium_count * 5
        base_score -= self.low_count * 2
        return max(0, min(100, base_score))


# Expected sections by command type
EXPECTED_SECTIONS = {
    CommandType.PLANNING: {
        "required": ["# ", "## Instructions", "## Report"],
        "recommended": ["## Plan Format", "## Relevant Files", "## GitHub Issue Creation"],
        "optional": ["## Variables", "## Pre-", "Checklist"]
    },
    CommandType.EXECUTION: {
        "required": ["# ", "## Instructions", "## Report"],
        "recommended": ["## Pre-", "## Validation Commands"],
        "optional": ["## Variables", "## GitHub"]
    },
    CommandType.UTILITY: {
        "required": ["# ", "## Run", "## Report"],
        "recommended": [],
        "optional": []
    },
    CommandType.ROUTING: {
        "required": ["# ", "## Instructions"],
        "recommended": ["## Routing Logic", "## Output Format"],
        "optional": ["## Error Handling"]
    },
    CommandType.ORCHESTRATION: {
        "required": ["# ", "## Instructions", "## Report"],
        "recommended": ["## Overview", "## Phase", "## Dependency"],
        "optional": ["## Error Handling", "## Rollback"]
    },
    CommandType.UNKNOWN: {
        "required": ["# ", "## Instructions"],
        "recommended": ["## Report"],
        "optional": []
    }
}

# Model recommendations by command type
MODEL_RECOMMENDATIONS = {
    CommandType.PLANNING: "opus",
    CommandType.EXECUTION: "opus",
    CommandType.UTILITY: "haiku",
    CommandType.ROUTING: "haiku",
    CommandType.ORCHESTRATION: "opus",
    CommandType.UNKNOWN: "opus"
}


def parse_frontmatter(content: str) -> tuple[dict, str]:
    """Extract YAML frontmatter and body from markdown content."""
    frontmatter = {}
    body = content

    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', content, re.DOTALL)

    if match:
        yaml_content = match.group(1)
        body = match.group(2)

        for line in yaml_content.split('\n'):
            line = line.strip()
            if ':' in line and not line.startswith('#'):
                key, _, value = line.partition(':')
                key = key.strip()
                value = value.strip()

                if value.startswith('[') and value.endswith(']'):
                    value = [v.strip().strip('"\'') for v in value[1:-1].split(',')]
                elif value.startswith('"') or value.startswith("'"):
                    value = value.strip('"\'')

                frontmatter[key] = value

    return frontmatter, body


def detect_command_type(frontmatter: dict, body: str) -> CommandType:
    """Detect command type from content analysis."""
    body_lower = body.lower()

    # Check for orchestration signals
    if any(x in body_lower for x in ['## phase 1', '## phase 2', 'orchestrat', 'coordinate']):
        return CommandType.ORCHESTRATION

    # Check for planning signals
    if any(x in body_lower for x in ['## plan format', 'github issue creation', 'create a plan']):
        return CommandType.PLANNING

    # Check for execution signals
    if any(x in body_lower for x in ['## validation commands', 'execute', 'implement']):
        return CommandType.EXECUTION

    # Check for routing signals
    if any(x in body_lower for x in ['routing', 'classify', 'route to', 'conditional']):
        return CommandType.ROUTING

    # Check for utility signals (simple, short)
    line_count = len(body.split('\n'))
    if line_count < 40 and '## run' in body_lower:
        return CommandType.UTILITY

    # Default based on model
    model = frontmatter.get('model', '')
    if model == 'haiku':
        return CommandType.UTILITY

    return CommandType.UNKNOWN


def analyze_frontmatter(frontmatter: dict, command_type: CommandType) -> list[Issue]:
    """Analyze frontmatter for issues."""
    issues = []

    # Check for missing frontmatter
    if not frontmatter:
        issues.append(Issue(
            severity=Severity.CRITICAL,
            category="frontmatter",
            message="Missing YAML frontmatter",
            suggestion="Add frontmatter with description, model, and allowed-tools",
            recommended_value="---\ndescription: ...\nmodel: opus\nallowed-tools: [...]\n---"
        ))
        return issues

    # Check description
    if 'description' not in frontmatter:
        issues.append(Issue(
            severity=Severity.CRITICAL,
            category="frontmatter",
            message="Missing 'description' field",
            suggestion="Add a concise description (< 200 chars)"
        ))
    elif len(str(frontmatter['description'])) > 200:
        issues.append(Issue(
            severity=Severity.MEDIUM,
            category="frontmatter",
            message=f"Description is {len(frontmatter['description'])} chars (> 200)",
            suggestion="Shorten description to under 200 characters",
            current_value=frontmatter['description'][:50] + "..."
        ))

    # Check model appropriateness
    if 'model' in frontmatter:
        recommended = MODEL_RECOMMENDATIONS.get(command_type, "opus")
        actual = frontmatter['model']
        if actual != recommended:
            if command_type == CommandType.UTILITY and actual == 'opus':
                issues.append(Issue(
                    severity=Severity.HIGH,
                    category="model",
                    message=f"Utility command using '{actual}' model",
                    suggestion=f"Consider using '{recommended}' for simple utility commands",
                    current_value=actual,
                    recommended_value=recommended
                ))
            elif command_type in [CommandType.PLANNING, CommandType.ORCHESTRATION] and actual == 'haiku':
                issues.append(Issue(
                    severity=Severity.HIGH,
                    category="model",
                    message=f"Complex {command_type.value} command using 'haiku' model",
                    suggestion=f"Use '{recommended}' for better quality output",
                    current_value=actual,
                    recommended_value=recommended
                ))
    else:
        issues.append(Issue(
            severity=Severity.MEDIUM,
            category="frontmatter",
            message="Missing 'model' field",
            suggestion=f"Add 'model: {MODEL_RECOMMENDATIONS.get(command_type, 'opus')}'"
        ))

    # Check allowed-tools
    if 'allowed-tools' not in frontmatter:
        issues.append(Issue(
            severity=Severity.LOW,
            category="frontmatter",
            message="No 'allowed-tools' restriction",
            suggestion="Consider restricting tools for security"
        ))

    return issues


def analyze_structure(body: str, command_type: CommandType) -> list[Issue]:
    """Analyze command structure for issues."""
    issues = []
    expected = EXPECTED_SECTIONS.get(command_type, EXPECTED_SECTIONS[CommandType.UNKNOWN])

    # Check required sections
    for section in expected["required"]:
        if section not in body:
            issues.append(Issue(
                severity=Severity.HIGH,
                category="structure",
                message=f"Missing required section: '{section}'",
                suggestion=f"Add '{section}' section"
            ))

    # Check recommended sections
    for section in expected["recommended"]:
        if section not in body:
            issues.append(Issue(
                severity=Severity.MEDIUM,
                category="structure",
                message=f"Missing recommended section: '{section}'",
                suggestion=f"Consider adding '{section}' section for {command_type.value} commands"
            ))

    # Check for $ARGUMENTS handling
    if 'argument-hint' in body or '[' in body[:500]:  # Likely has args
        if '$ARGUMENTS' not in body and '$1' not in body:
            issues.append(Issue(
                severity=Severity.HIGH,
                category="input",
                message="Has argument-hint but no $ARGUMENTS handling",
                suggestion="Add $ARGUMENTS to capture user input"
            ))

    # Check for mixing $ARGUMENTS with positional $1/$2/$3 (anti-pattern)
    has_arguments = '$ARGUMENTS' in body
    has_positional = bool(re.search(r'\$[1-9]', body))
    if has_arguments and has_positional:
        issues.append(Issue(
            severity=Severity.HIGH,
            category="input",
            message="Mixing $ARGUMENTS and positional arguments ($1, $2, etc.)",
            suggestion="Use one style consistently: $ARGUMENTS for free-form, $1/$2 for structured"
        ))

    # Check for numbered instructions
    if '## Instructions' in body or '## Run' in body:
        # Look for numbered steps
        if not re.search(r'^\d+\.\s+\*\*', body, re.MULTILINE):
            issues.append(Issue(
                severity=Severity.MEDIUM,
                category="clarity",
                message="Instructions not using numbered steps with bold headers",
                suggestion="Use '1. **Step name**: description' format for clarity"
            ))

    return issues


def analyze_quality(body: str, frontmatter: dict) -> list[Issue]:
    """Analyze overall quality."""
    issues = []

    # Check for TODO/FIXME
    if 'TODO' in body or 'FIXME' in body:
        issues.append(Issue(
            severity=Severity.MEDIUM,
            category="completeness",
            message="Contains TODO/FIXME markers",
            suggestion="Complete or remove TODO/FIXME items"
        ))

    # Check for placeholder text
    placeholders = re.findall(r'<[^>]+>', body)
    template_placeholders = [p for p in placeholders if not p.startswith('<antml')]
    if len(template_placeholders) > 5:
        issues.append(Issue(
            severity=Severity.LOW,
            category="completeness",
            message=f"Many placeholder markers ({len(template_placeholders)}) - may be incomplete",
            suggestion="Replace placeholders with actual content"
        ))

    # Check description length
    desc = frontmatter.get('description', '')
    if desc and len(desc) < 20:
        issues.append(Issue(
            severity=Severity.LOW,
            category="quality",
            message="Description is very short",
            suggestion="Provide a more descriptive summary"
        ))

    # Check for !command syntax without allowed-tools for Bash
    bash_embeds = re.findall(r'!`[^`]+`', body)
    if bash_embeds:
        allowed_tools = frontmatter.get('allowed-tools', [])
        if isinstance(allowed_tools, str):
            allowed_tools = [allowed_tools]
        has_bash_permission = any('Bash' in str(t) for t in allowed_tools)
        if not has_bash_permission:
            issues.append(Issue(
                severity=Severity.HIGH,
                category="tools",
                message=f"Uses !command syntax ({len(bash_embeds)} times) without Bash in allowed-tools",
                suggestion="Add 'Bash' to allowed-tools or !command execution will fail",
                current_value=", ".join(bash_embeds[:3]) + ("..." if len(bash_embeds) > 3 else "")
            ))

    # Check for static prompts without dynamic content
    has_file_refs = bool(re.search(r'@[\w./]+', body))
    has_bash_embed = bool(bash_embeds)
    has_arguments = '$ARGUMENTS' in body or bool(re.search(r'\$[1-9]', body))
    if not has_file_refs and not has_bash_embed and not has_arguments:
        issues.append(Issue(
            severity=Severity.MEDIUM,
            category="dynamic",
            message="Static prompt with no dynamic content",
            suggestion="Add @filepath for files, !command for context, or $ARGUMENTS for input"
        ))

    # Check for integration opportunities
    if 'github' in body.lower() and 'gh issue' not in body.lower():
        issues.append(Issue(
            severity=Severity.LOW,
            category="integration",
            message="Mentions GitHub but doesn't use gh CLI",
            suggestion="Consider adding GitHub CLI integration"
        ))

    if any(x in body.lower() for x in ['implement', 'feature', 'bug']) and 'conditional_docs' not in body.lower():
        issues.append(Issue(
            severity=Severity.LOW,
            category="integration",
            message="Planning/execution command without conditional documentation loading",
            suggestion="Consider adding /conditional_docs integration for context"
        ))

    return issues


# Character budget threshold (shared across ALL commands)
CHAR_BUDGET_TOTAL = 15000
CHAR_BUDGET_WARN = 2000  # Warn if single command exceeds this


def analyze_size(content: str, frontmatter: dict) -> list[Issue]:
    """Analyze command size for character budget concerns."""
    issues = []

    total_chars = len(content)
    desc_chars = len(str(frontmatter.get('description', '')))

    # Warn if command is very large
    if total_chars > CHAR_BUDGET_WARN:
        percentage = (total_chars / CHAR_BUDGET_TOTAL) * 100
        issues.append(Issue(
            severity=Severity.MEDIUM,
            category="size",
            message=f"Command is {total_chars:,} chars ({percentage:.1f}% of 15k budget)",
            suggestion="Consider shortening or splitting into skill if budget is tight",
            current_value=f"{total_chars:,} characters"
        ))

    # Warn if description is too long (contributes to budget)
    if desc_chars > 200:
        issues.append(Issue(
            severity=Severity.MEDIUM,
            category="size",
            message=f"Description is {desc_chars} chars (recommended < 200)",
            suggestion="Shorten description to conserve character budget"
        ))

    return issues


def analyze_command(file_path: Path) -> AnalysisResult:
    """Perform deep analysis of a slash command."""
    if not file_path.exists():
        result = AnalysisResult(
            command_name=file_path.stem,
            command_type=CommandType.UNKNOWN,
            file_path=str(file_path)
        )
        result.issues.append(Issue(
            severity=Severity.CRITICAL,
            category="file",
            message=f"File not found: {file_path}",
            suggestion="Check the file path"
        ))
        return result

    content = file_path.read_text(encoding='utf-8')

    if not content.strip():
        result = AnalysisResult(
            command_name=file_path.stem,
            command_type=CommandType.UNKNOWN,
            file_path=str(file_path)
        )
        result.issues.append(Issue(
            severity=Severity.CRITICAL,
            category="file",
            message="File is empty",
            suggestion="Add command content"
        ))
        return result

    frontmatter, body = parse_frontmatter(content)
    command_type = detect_command_type(frontmatter, body)

    result = AnalysisResult(
        command_name=file_path.stem,
        command_type=command_type,
        file_path=str(file_path)
    )

    # Run all analysis checks
    result.issues.extend(analyze_frontmatter(frontmatter, command_type))
    result.issues.extend(analyze_structure(body, command_type))
    result.issues.extend(analyze_quality(body, frontmatter))
    result.issues.extend(analyze_size(content, frontmatter))

    # Calculate scores
    result.scores = {
        "frontmatter": 100 - sum(10 for i in result.issues if i.category == "frontmatter"),
        "structure": 100 - sum(15 for i in result.issues if i.category == "structure"),
        "quality": 100 - sum(5 for i in result.issues if i.category in ["quality", "clarity", "completeness", "dynamic"]),
        "tools": 100 - sum(15 for i in result.issues if i.category == "tools"),
        "input": 100 - sum(10 for i in result.issues if i.category == "input"),
        "size": 100 - sum(10 for i in result.issues if i.category == "size"),
        "integration": 100 - sum(5 for i in result.issues if i.category == "integration"),
        "overall": result.overall_score
    }

    # Generate recommendations
    if result.critical_count > 0:
        result.recommendations.append("Fix critical issues before using this command")
    if result.high_count > 0:
        result.recommendations.append("Address high-severity issues for better reliability")
    if result.scores["integration"] < 100:
        result.recommendations.append("Consider adding integrations for enhanced functionality")
    if result.overall_score >= 80:
        result.recommendations.append("Command is in good shape with minor improvements possible")

    return result


def format_report(result: AnalysisResult) -> str:
    """Format analysis result as human-readable report."""
    lines = []

    # Header
    emoji = "\u2705" if result.critical_count == 0 else "\u274c"
    lines.append(f"\n{emoji} Analysis: {result.command_name}")
    lines.append(f"   Type: {result.command_type.value}")
    lines.append(f"   Score: {result.overall_score}/100")
    lines.append("")

    # Issue summary
    lines.append("   Issue Summary:")
    lines.append(f"   \u274c Critical: {result.critical_count}")
    lines.append(f"   \u26a0\ufe0f  High: {result.high_count}")
    lines.append(f"   \u2139\ufe0f  Medium: {result.medium_count}")
    lines.append(f"   \U0001f4a1 Low: {result.low_count}")
    lines.append("")

    # Issues by severity
    if result.issues:
        lines.append("   Issues Found:")
        for severity in [Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM, Severity.LOW]:
            severity_issues = [i for i in result.issues if i.severity == severity]
            if severity_issues:
                lines.append(f"\n   ### {severity.value.upper()}")
                for issue in severity_issues:
                    lines.append(f"   - [{issue.category}] {issue.message}")
                    lines.append(f"     Suggestion: {issue.suggestion}")
                    if issue.current_value:
                        lines.append(f"     Current: {issue.current_value}")
                    if issue.recommended_value:
                        lines.append(f"     Recommended: {issue.recommended_value}")

    # Scores
    lines.append("\n   Scores:")
    for category, score in result.scores.items():
        bar = "\u2588" * (score // 10) + "\u2591" * (10 - score // 10)
        lines.append(f"   {category:12} [{bar}] {score}")

    # Recommendations
    if result.recommendations:
        lines.append("\n   Recommendations:")
        for rec in result.recommendations:
            lines.append(f"   \u2192 {rec}")

    lines.append("")
    return "\n".join(lines)


def format_json(result: AnalysisResult) -> str:
    """Format analysis result as JSON."""
    return json.dumps({
        "command_name": result.command_name,
        "command_type": result.command_type.value,
        "file_path": result.file_path,
        "overall_score": result.overall_score,
        "issue_counts": {
            "critical": result.critical_count,
            "high": result.high_count,
            "medium": result.medium_count,
            "low": result.low_count
        },
        "issues": [
            {
                "severity": i.severity.value,
                "category": i.category,
                "message": i.message,
                "suggestion": i.suggestion,
                "current_value": i.current_value,
                "recommended_value": i.recommended_value
            }
            for i in result.issues
        ],
        "scores": result.scores,
        "recommendations": result.recommendations
    }, indent=2)


def format_brief(result: AnalysisResult) -> str:
    """Format analysis result as brief summary."""
    status = "PASS" if result.critical_count == 0 else "FAIL"
    return f"{result.command_name}: {status} (Score: {result.overall_score}, C:{result.critical_count} H:{result.high_count} M:{result.medium_count} L:{result.low_count})"


def main():
    parser = argparse.ArgumentParser(
        description="Deep analysis of Claude Code slash commands"
    )
    parser.add_argument(
        'command_file',
        type=Path,
        help="Path to the command .md file to analyze"
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help="Output results as JSON"
    )
    parser.add_argument(
        '--brief',
        action='store_true',
        help="Output brief summary only"
    )

    args = parser.parse_args()

    result = analyze_command(args.command_file)

    if args.json:
        print(format_json(result))
    elif args.brief:
        print(format_brief(result))
    else:
        print(format_report(result))

    # Exit codes
    if result.critical_count > 0:
        sys.exit(2)
    elif result.high_count > 0:
        sys.exit(10)
    elif result.medium_count > 0:
        sys.exit(20)
    else:
        sys.exit(0)


if __name__ == '__main__':
    main()
