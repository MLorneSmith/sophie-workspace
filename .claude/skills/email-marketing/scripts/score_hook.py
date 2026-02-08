#!/usr/bin/env python3
"""
Hook Quality Scorer

Calculate weighted hook quality score based on 5 criteria.

Criteria (weight):
  1. Open Loop Power (3) - Creates unresolved psychological tension
  2. Specificity (2) - Uses concrete details vs. generic
  3. Relevance (2) - Connects to audience pain points
  4. Bridge Potential (2) - Leads naturally to main content
  5. Authenticity (1) - Rings true to brand voice

Usage:
    python score_hook.py --criteria "5,4,4,4,3"
    python score_hook.py --criteria "5,4,4,4,3" --threshold 35

Exit codes:
    0  = Score meets threshold (PASS)
    1  = Error (invalid input)
    10 = Score below threshold (FAIL)
"""

import argparse
import sys
from dataclasses import dataclass


@dataclass
class HookScore:
    """Result of hook scoring."""
    open_loop: int
    specificity: int
    relevance: int
    bridge: int
    authenticity: int

    # Weights
    WEIGHTS = {
        "open_loop": 3,
        "specificity": 2,
        "relevance": 2,
        "bridge": 2,
        "authenticity": 1,
    }

    MAX_SCORE = 50  # 5 * (3 + 2 + 2 + 2 + 1) = 50

    @property
    def weighted_total(self) -> int:
        """Calculate weighted total score."""
        return (
            self.open_loop * self.WEIGHTS["open_loop"]
            + self.specificity * self.WEIGHTS["specificity"]
            + self.relevance * self.WEIGHTS["relevance"]
            + self.bridge * self.WEIGHTS["bridge"]
            + self.authenticity * self.WEIGHTS["authenticity"]
        )

    def passes(self, threshold: int = 40) -> bool:
        """Check if score meets threshold."""
        return self.weighted_total >= threshold

    def verdict(self, threshold: int = 40) -> str:
        """Get verdict based on score."""
        score = self.weighted_total
        if score >= 40:
            return "STRONG HOOK - Proceed"
        elif score >= 30:
            return "NEEDS REFINEMENT"
        else:
            return "RETHINK APPROACH"

    def to_report(self, threshold: int = 40) -> str:
        """Generate human-readable report."""
        lines = [
            "=" * 50,
            "HOOK QUALITY SCORE",
            "=" * 50,
            "",
            "CRITERIA SCORES:",
            f"  Open Loop Power (x3):  {self.open_loop}/5  = {self.open_loop * 3}",
            f"  Specificity (x2):      {self.specificity}/5  = {self.specificity * 2}",
            f"  Relevance (x2):        {self.relevance}/5  = {self.relevance * 2}",
            f"  Bridge Potential (x2): {self.bridge}/5  = {self.bridge * 2}",
            f"  Authenticity (x1):     {self.authenticity}/5  = {self.authenticity * 1}",
            "",
            "-" * 50,
            f"  TOTAL: {self.weighted_total}/{self.MAX_SCORE}",
            "",
            f"THRESHOLD: {threshold}",
            f"VERDICT: {self.verdict(threshold)}",
            "",
            "SCORING GUIDE:",
            "  40-50: Strong hook - proceed",
            "  30-39: Needs refinement",
            "  <30:   Rethink approach",
            "=" * 50,
        ]
        return "\n".join(lines)


def parse_criteria(criteria_str: str) -> tuple[int, int, int, int, int]:
    """Parse comma-separated criteria string into tuple."""
    parts = criteria_str.split(",")
    if len(parts) != 5:
        raise ValueError(
            f"Expected 5 comma-separated scores, got {len(parts)}. "
            "Format: open_loop,specificity,relevance,bridge,authenticity"
        )

    scores = []
    for i, part in enumerate(parts):
        try:
            score = int(part.strip())
            if not 1 <= score <= 5:
                raise ValueError(f"Score {i + 1} must be between 1 and 5, got {score}")
            scores.append(score)
        except ValueError as e:
            raise ValueError(f"Invalid score at position {i + 1}: {part}") from e

    return tuple(scores)


def main():
    parser = argparse.ArgumentParser(
        description="Calculate weighted hook quality score"
    )
    parser.add_argument(
        "--criteria", "-c",
        required=True,
        help="Comma-separated scores (1-5): open_loop,specificity,relevance,bridge,authenticity"
    )
    parser.add_argument(
        "--threshold", "-t",
        type=int,
        default=40,
        help="Minimum passing score (default: 40)"
    )

    args = parser.parse_args()

    try:
        scores = parse_criteria(args.criteria)
    except ValueError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    hook_score = HookScore(
        open_loop=scores[0],
        specificity=scores[1],
        relevance=scores[2],
        bridge=scores[3],
        authenticity=scores[4],
    )

    print(hook_score.to_report(args.threshold))

    if hook_score.passes(args.threshold):
        sys.exit(0)
    else:
        sys.exit(10)


if __name__ == "__main__":
    main()
