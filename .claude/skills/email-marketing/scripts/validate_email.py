#!/usr/bin/env python3
"""
Email Style Validator

Validates an email YAML file against Andre Chaperon's style patterns.
Checks for mandatory elements, formatting metrics, and technique application.

Usage:
    python validate_email.py path/to/email.yaml
    python validate_email.py path/to/email.yaml --verbose

Exit codes:
    0  = Validation passed
    1  = Error (file not found, parse error)
    10 = Validation failed (missing mandatory elements)
"""

import argparse
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

# Graceful YAML import
try:
    import yaml
except ImportError:
    yaml = None


@dataclass
class ValidationResult:
    """Result of email validation."""
    success: bool
    email_path: str
    mandatory_checks: dict = field(default_factory=dict)
    formatting_metrics: dict = field(default_factory=dict)
    technique_count: int = 0
    issues: list = field(default_factory=list)
    recommendations: list = field(default_factory=list)
    overall_score: int = 0

    def to_report(self) -> str:
        """Generate human-readable report."""
        lines = [
            "=" * 60,
            "EMAIL VALIDATION REPORT",
            "=" * 60,
            f"File: {self.email_path}",
            f"Status: {'PASS' if self.success else 'FAIL'}",
            "",
            "MANDATORY ELEMENTS:",
        ]

        for check, passed in self.mandatory_checks.items():
            status = "✓" if passed else "✗"
            lines.append(f"  {status} {check}")

        lines.extend([
            "",
            "FORMATTING METRICS:",
            f"  Average line length: {self.formatting_metrics.get('avg_line_length', 0):.1f} words (target: 3-8)",
            f"  White space ratio: {self.formatting_metrics.get('white_space_ratio', 0):.0%} (target: 40-60%)",
            f"  Total lines: {self.formatting_metrics.get('total_lines', 0)}",
            "",
            f"TECHNIQUES DETECTED: {self.technique_count}",
        ])

        if self.issues:
            lines.extend(["", "ISSUES:"])
            for issue in self.issues:
                lines.append(f"  - {issue}")

        if self.recommendations:
            lines.extend(["", "RECOMMENDATIONS:"])
            for rec in self.recommendations:
                lines.append(f"  - {rec}")

        lines.extend([
            "",
            f"OVERALL SCORE: {self.overall_score}/100",
            "=" * 60,
        ])

        return "\n".join(lines)


def parse_yaml_file(filepath: Path) -> Optional[dict]:
    """Parse YAML file, handling missing yaml module."""
    if yaml is None:
        # Fallback: basic parsing for content.body
        content = filepath.read_text()
        body_match = re.search(r'body:\s*\|(.+?)(?=^\w|\Z)', content, re.MULTILINE | re.DOTALL)
        if body_match:
            return {"content": {"body": body_match.group(1).strip()}}
        return None

    with open(filepath) as f:
        return yaml.safe_load(f)


def check_personal_greeting(body: str) -> bool:
    """Check for personal greeting like 'Hey, it's [Name]'."""
    patterns = [
        r"hey,?\s+it'?s\s+\w+",
        r"hi,?\s+it'?s\s+\w+",
        r"hey\s+\w+",
    ]
    for pattern in patterns:
        if re.search(pattern, body.lower()):
            return True
    return False


def check_ps_section(body: str) -> bool:
    """Check for P.S. section."""
    patterns = [r"\bP\.?S\.?\b", r"\bPS\b", r"\bP\.S\.\b"]
    for pattern in patterns:
        if re.search(pattern, body, re.IGNORECASE):
            return True
    return False


def check_short_line_rhythm(body: str) -> tuple[bool, float]:
    """Check for short line rhythm (avg 3-8 words per line)."""
    lines = [line.strip() for line in body.split("\n") if line.strip()]
    if not lines:
        return False, 0.0

    word_counts = [len(line.split()) for line in lines]
    avg = sum(word_counts) / len(word_counts)

    return 3 <= avg <= 8, avg


def calculate_white_space_ratio(body: str) -> float:
    """Calculate ratio of blank lines to total lines."""
    lines = body.split("\n")
    total = len(lines)
    blank = sum(1 for line in lines if not line.strip())
    return blank / total if total > 0 else 0


def detect_techniques(body: str) -> list[str]:
    """Detect techniques used in the email."""
    techniques = []

    technique_patterns = {
        "Open Loop": [r"tomorrow", r"next\s+email", r"stay\s+tuned", r"coming\s+up"],
        "Curiosity Gap": [r"here'?s\s+the\s+thing", r"secret", r"reveal"],
        "Story Hook": [r"last\s+(tuesday|week|month)", r"(\d+)\s*(am|pm)", r"there\s+i\s+was"],
        "Pattern Interrupt": [r"^stop\.", r"wait", r"hold\s+on"],
        "Soft Sell": [r"if\s+you'?re\s+interested", r"when\s+you'?re\s+ready", r"no\s+pressure"],
        "Future Pacing": [r"imagine", r"picture\s+yourself", r"what\s+if"],
        "Reply Prompt": [r"hit\s+reply", r"let\s+me\s+know", r"reply\s+and"],
        "Conversational Aside": [r"\([^)]+\)", r"—[^—]+—"],
        "Clever Signature": [r'\w+\s+"[^"]+"\s+\w+'],
    }

    body_lower = body.lower()
    for technique, patterns in technique_patterns.items():
        for pattern in patterns:
            if re.search(pattern, body_lower):
                techniques.append(technique)
                break

    return techniques


def validate_email(filepath: Path, verbose: bool = False) -> ValidationResult:
    """Validate an email file against style patterns."""
    result = ValidationResult(
        success=True,
        email_path=str(filepath),
    )

    # Parse file
    data = parse_yaml_file(filepath)
    if not data:
        result.success = False
        result.issues.append("Could not parse email file")
        return result

    # Extract body
    body = data.get("content", {}).get("body", "")
    if not body:
        result.success = False
        result.issues.append("No body content found")
        return result

    # Mandatory checks
    result.mandatory_checks["Personal Greeting"] = check_personal_greeting(body)
    rhythm_ok, avg_length = check_short_line_rhythm(body)
    result.mandatory_checks["Short Line Rhythm"] = rhythm_ok
    result.mandatory_checks["P.S. Section"] = check_ps_section(body)

    # Formatting metrics
    result.formatting_metrics["avg_line_length"] = avg_length
    result.formatting_metrics["white_space_ratio"] = calculate_white_space_ratio(body)
    result.formatting_metrics["total_lines"] = len(body.split("\n"))

    # Technique detection
    techniques = detect_techniques(body)
    result.technique_count = len(techniques)

    # Calculate score
    score = 0
    if result.mandatory_checks["Personal Greeting"]:
        score += 25
    if result.mandatory_checks["Short Line Rhythm"]:
        score += 25
    if result.mandatory_checks["P.S. Section"]:
        score += 25
    if result.technique_count >= 3:
        score += 25
    elif result.technique_count >= 1:
        score += 10

    result.overall_score = score

    # Determine success
    mandatory_failures = [k for k, v in result.mandatory_checks.items() if not v]
    if mandatory_failures:
        result.success = False
        for failure in mandatory_failures:
            result.issues.append(f"Missing mandatory element: {failure}")

    # Add recommendations
    if not result.mandatory_checks["Personal Greeting"]:
        result.recommendations.append("Add personal greeting like 'Hey, it's [Name]...'")
    if not result.mandatory_checks["P.S. Section"]:
        result.recommendations.append("Add a P.S. section with strategic purpose")
    if avg_length > 8:
        result.recommendations.append("Shorten lines - aim for 3-8 words per line")
    if result.technique_count < 3:
        result.recommendations.append(f"Apply more techniques - currently {result.technique_count}, aim for 3+")

    white_space = result.formatting_metrics["white_space_ratio"]
    if white_space < 0.4:
        result.recommendations.append("Add more white space between lines")
    elif white_space > 0.6:
        result.recommendations.append("Reduce excessive white space")

    return result


def main():
    parser = argparse.ArgumentParser(
        description="Validate email against Andre Chaperon's style patterns"
    )
    parser.add_argument("filepath", help="Path to email YAML file")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")

    args = parser.parse_args()
    filepath = Path(args.filepath)

    if not filepath.exists():
        print(f"Error: File not found: {filepath}", file=sys.stderr)
        sys.exit(1)

    result = validate_email(filepath, verbose=args.verbose)
    print(result.to_report())

    if result.success:
        sys.exit(0)
    else:
        sys.exit(10)


if __name__ == "__main__":
    main()
