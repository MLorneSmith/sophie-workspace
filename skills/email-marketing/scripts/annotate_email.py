#!/usr/bin/env python3
"""
Email Annotation Script

Analyzes an email YAML file and adds technique annotations based on the
techniques library. Can use LLM for analysis or run in manual mode.

Usage:
    python annotate_email.py path/to/email.yaml [--dry-run] [--llm]
    python annotate_email.py --batch path/to/dir [--dry-run] [--llm]

Arguments:
    path              Path to email YAML file or directory (with --batch)
    --dry-run         Print annotations without saving
    --llm             Use LLM for analysis (requires ANTHROPIC_API_KEY)
    --batch           Process all unannotated emails in directory
    --force           Re-annotate even if annotations exist
"""

import argparse
import os
import re
import sys
from pathlib import Path
from typing import Optional

try:
    import yaml
except ImportError:
    print("Error: PyYAML required. Install with: pip install pyyaml")
    sys.exit(1)


# Technique patterns for rule-based detection
TECHNIQUE_PATTERNS = {
    "Personal Greeting": [
        r"^Hey,?\s+it'?s\s+\w+",
        r"^Hi\s+\w+,",
        r"^Hey\s+\w+,",
    ],
    "Campaign Abbreviation": [
        r"^\[[\w]+\]",
        r"^[\w]+\s*/\s*",
        r"^\[BPM\]",
        r"^\[LEM\]",
        r"^TWN\s*/",
    ],
    "Open Loop": [
        r"I'?ll\s+tell\s+you",
        r"more\s+on\s+that\s+(tomorrow|later|soon|next)",
        r"stay\s+tuned",
        r"in\s+(my\s+)?next\s+email",
        r"part\s+\d+\s+of\s+\d+",
        r"to\s+be\s+continued",
    ],
    "P.S. Section": [
        r"^P\.?S\.?",
        r"\nP\.?S\.?",
    ],
    "Curiosity Gap": [
        r"here'?s\s+the\s+thing",
        r"but\s+here'?s\s+what",
        r"the\s+(real|actual)\s+(secret|truth|reason)",
        r"what\s+most\s+people\s+(don'?t|never)\s+(know|realize)",
    ],
    "Permission to Leave": [
        r"unsubscribe",
        r"no\s+hard\s+feelings",
        r"if\s+(this\s+)?isn'?t\s+for\s+you",
        r"wrong\s+place",
        r"not\s+a\s+fit",
    ],
    "Social Proof": [
        r"(client|customer|student)s?\s+(say|said|told)",
        r"testimonial",
        r"\d+\s+(people|subscribers|students)",
        r"(Perry|Ryan|experts?)\s+(say|said)",
    ],
    "Soft Sell": [
        r"no(thing)?\s+(to|for\s+you\s+to)\s+buy",
        r"on\s+the\s+house",
        r"free",
        r"yours\s+free",
    ],
    "Clever Signature": [
        r'\w+\s+"[^"]+"\s+\w+',
        r"\w+\s+'[^']+'\s+\w+",
    ],
    "Contrarian": [
        r"(most|everyone)\s+(thinks?|believes?|says?)",
        r"conventional\s+wisdom",
        r"the\s+opposite\s+is\s+true",
        r"(myth|lie|wrong)",
    ],
    "Story Hook": [
        r"(last|this)\s+(week|month|year|tuesday|monday)",
        r"I\s+remember\s+when",
        r"years?\s+ago",
        r"true\s+story",
    ],
    "Question Hook": [
        r"^(have\s+you|do\s+you|what\s+if|why\s+do)",
        r"\?\s*$",
    ],
}


def detect_techniques(body: str, subject: str = "") -> list:
    """
    Rule-based technique detection.
    Returns list of detected techniques with locations.
    """
    detected = []
    full_text = f"{subject}\n{body}"
    
    for technique, patterns in TECHNIQUE_PATTERNS.items():
        for pattern in patterns:
            matches = list(re.finditer(pattern, full_text, re.IGNORECASE | re.MULTILINE))
            if matches:
                # Determine location
                match = matches[0]
                pos = match.start()
                if pos < len(subject) + 10:
                    location = "subject_line"
                elif pos < len(full_text) * 0.2:
                    location = "opening"
                elif pos > len(full_text) * 0.8:
                    location = "closing"
                elif "P.S" in technique or pos > len(full_text) * 0.9:
                    location = "P.S."
                else:
                    location = "body"
                
                detected.append({
                    "technique": technique,
                    "location": location,
                    "example": match.group()[:80],
                    "notes": f"Detected via pattern matching"
                })
                break  # Only add each technique once
    
    return detected


def determine_email_type(body: str, subject: str = "", labels: list = None) -> str:
    """Determine email type based on content and metadata."""
    text = f"{subject} {body}".lower()
    labels = labels or []
    labels_lower = [l.lower() for l in labels]
    
    # Check labels first
    if any("newsletter" in l for l in labels_lower):
        return "newsletter"
    if any("welcome" in l for l in labels_lower):
        return "welcome"
    
    # Check subject patterns
    if re.search(r"welcome|thanks?\s+for\s+(signing|joining)", text):
        return "welcome"
    if re.search(r"(issue|edition)\s*#?\d+", text) or "twn" in subject.lower():
        return "newsletter"
    if re.search(r"(buy|purchase|order|checkout|discount|offer)", text):
        return "sales"
    if re.search(r"(part\s+\d+|story|remember\s+when)", text):
        return "story"
    if re.search(r"(onboarding|getting\s+started|day\s+\d+)", text):
        return "onboarding"
    
    return "nurture"


def create_annotations(email_data: dict, techniques: list) -> dict:
    """Create full annotations structure."""
    headers = email_data.get("headers", {})
    content = email_data.get("content", {})
    metadata = email_data.get("metadata", {})
    
    subject = headers.get("subject", "")
    body = content.get("body", "")
    labels = metadata.get("labels", [])
    
    # Extract campaign from subject
    campaign_match = re.match(r"^\[(\w+)\]|^(\w+)\s*/", subject)
    campaign = campaign_match.group(1) or campaign_match.group(2) if campaign_match else ""
    
    email_type = determine_email_type(body, subject, labels)
    
    annotations = {
        "campaign": campaign.upper() if campaign else "",
        "campaign_full": "",  # Would need lookup table
        "position": None,
        "sequence_length": None,
        "email_type": email_type,
        "purpose": "",  # Requires LLM or manual entry
        "audience": "",  # Requires LLM or manual entry
        "techniques_used": [
            {
                "technique": t["technique"],
                "location": t["location"],
                "example": t["example"],
                "notes": t["notes"]
            }
            for t in techniques
        ],
        "hooks": {
            "primary": {
                "type": "",
                "text": "",
                "why_effective": ""
            }
        },
        "open_loops": [],
        "callbacks": [],
        "quotable_lines": [],
        "notes": "Auto-annotated via pattern matching. Review and enhance manually."
    }
    
    return annotations


def annotate_email(filepath: Path, dry_run: bool = False, use_llm: bool = False) -> bool:
    """
    Annotate a single email file.
    Returns True if annotations were added/updated.
    """
    with open(filepath) as f:
        data = yaml.safe_load(f)
    
    if not data or not isinstance(data, dict):
        print(f"  ✗ Invalid YAML structure")
        return False
    
    # Check if already annotated
    existing = data.get("annotations", {})
    if existing and existing.get("techniques_used"):
        print(f"  ✓ Already annotated ({len(existing.get('techniques_used', []))} techniques)")
        return False
    
    # Get content
    content = data.get("content", {})
    headers = data.get("headers", {})
    body = content.get("body", "") if isinstance(content, dict) else str(content)
    subject = headers.get("subject", "") if isinstance(headers, dict) else ""
    
    if not body:
        print(f"  ✗ No email body found")
        return False
    
    # Detect techniques
    techniques = detect_techniques(body, subject)
    
    if not techniques:
        print(f"  ⚠ No techniques detected")
        # Still create basic annotations
    
    # Create annotations
    annotations = create_annotations(data, techniques)
    data["annotations"] = annotations
    
    print(f"  → Detected {len(techniques)} techniques: {[t['technique'] for t in techniques]}")
    print(f"  → Email type: {annotations['email_type']}")
    
    if dry_run:
        print(f"  [DRY RUN] Would save annotations")
        return True
    
    # Save
    with open(filepath, 'w') as f:
        # Preserve comment header
        yaml.dump(data, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
    
    print(f"  ✓ Saved annotations")
    return True


def main():
    parser = argparse.ArgumentParser(description="Annotate email YAML files")
    parser.add_argument("path", help="Path to email YAML file or directory")
    parser.add_argument("--dry-run", action="store_true", help="Print without saving")
    parser.add_argument("--llm", action="store_true", help="Use LLM for analysis")
    parser.add_argument("--batch", action="store_true", help="Process all files in directory")
    parser.add_argument("--force", action="store_true", help="Re-annotate existing")
    
    args = parser.parse_args()
    path = Path(args.path)
    
    if args.llm:
        print("Note: LLM mode not yet implemented. Using rule-based detection.")
    
    if args.batch:
        if not path.is_dir():
            print(f"Error: {path} is not a directory")
            sys.exit(1)
        
        files = list(path.glob("*.yaml"))
        print(f"Processing {len(files)} files in {path}...")
        
        annotated = 0
        for f in sorted(files):
            if f.name.startswith("_"):
                continue
            print(f"\n{f.name}:")
            if annotate_email(f, dry_run=args.dry_run, use_llm=args.llm):
                annotated += 1
        
        print(f"\n{'Would annotate' if args.dry_run else 'Annotated'}: {annotated}/{len(files)} files")
    else:
        if not path.is_file():
            print(f"Error: {path} is not a file")
            sys.exit(1)
        
        print(f"Annotating {path.name}...")
        annotate_email(path, dry_run=args.dry_run, use_llm=args.llm)


if __name__ == "__main__":
    main()
