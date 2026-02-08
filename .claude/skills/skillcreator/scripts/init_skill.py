#!/usr/bin/env python3
"""
Skill Initializer - Creates a new skill directory from template.

Part of the skillcreator skill.

Usage:
    python init_skill.py <skill-name> --path <path>

Examples:
    python init_skill.py my-new-skill --path ~/.claude/skills
    python init_skill.py api-helper --path /custom/location

Exit Codes:
    0  - Success
    1  - General failure
    2  - Invalid arguments
    3  - Directory already exists
"""

import re
import sys
from pathlib import Path


# ===========================================================================
# TEMPLATES
# ===========================================================================

SKILL_TEMPLATE = '''---
name: {skill_name}
description: >
  [TODO: Clear description of what this skill does and WHEN to use it.
  Be specific about scenarios, file types, or tasks that trigger it.
  Max 1024 chars, no angle brackets.]
license: MIT
metadata:
  version: 1.0.0
---

# {skill_title}

[TODO: 1-2 sentence introduction]

---

## Quick Start

```
[TODO: Example invocation]
```

---

## Triggers

- `[TODO: trigger phrase 1]` - [description]
- `[TODO: trigger phrase 2]` - [description]
- `[TODO: trigger phrase 3]` - [description]

| Input | Output |
|-------|--------|
| [TODO] | [TODO] |

---

## Process

### Phase 1: [TODO: Phase Name]

[TODO: What happens in this phase]

1. **[Step]** - [Description]
2. **[Step]** - [Description]

**Verification:** [How to verify phase completion]

---

## Anti-Patterns

| Avoid | Why | Instead |
|-------|-----|---------|
| [TODO] | [TODO] | [TODO] |

---

## Verification

After execution:

- [ ] [TODO: Verification check 1]
- [ ] [TODO: Verification check 2]
- [ ] [TODO: Verification check 3]

---

## Extension Points

1. **[TODO]:** [How this skill can be extended]
2. **[TODO]:** [Additional extension point]

---

## Resources

### scripts/

Executable Python scripts for automation and verification.
See `assets/templates/script-template.py` for the standard pattern.

### references/

Documentation loaded into context as needed.
Keep detailed information here to keep SKILL.md lean.

### assets/

Files used in output (templates, images, fonts).
Not loaded into context, but copied/used in final output.

**Delete any directories not needed for this skill.**
'''

EXAMPLE_SCRIPT = '''#!/usr/bin/env python3
"""
example.py - Example script for {skill_name}

Part of the {skill_name} skill.

Responsibilities:
- [TODO: What this script does]

Usage:
    python example.py <input> [--verbose]
    python example.py --help

Exit Codes:
    0  - Success
    1  - General failure
    10 - Validation failure
    11 - Verification failure
"""

import argparse
import json
import sys
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import List


@dataclass
class Result:
    """Standard result object for script operations."""
    success: bool
    message: str
    data: dict = field(default_factory=dict)
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    def __bool__(self) -> bool:
        return self.success

    def to_dict(self) -> dict:
        return {{
            "success": self.success,
            "message": self.message,
            "data": self.data,
            "errors": self.errors,
            "warnings": self.warnings,
            "timestamp": datetime.now().isoformat()
        }}


def process(input_path: Path, options: dict) -> Result:
    """Main processing logic."""
    if not input_path.exists():
        return Result(
            success=False,
            message=f"Input file not found: {{input_path}}",
            errors=[f"File not found: {{input_path}}"]
        )

    # TODO: Implement processing logic
    return Result(
        success=True,
        message="Processing complete",
        data={{"processed": True}}
    )


def verify_result(result: Result) -> tuple[bool, str]:
    """Self-verification of the result."""
    if not result.success:
        return False, f"Processing failed: {{result.message}}"

    # TODO: Add verification logic
    return True, "Verification passed"


def main():
    parser = argparse.ArgumentParser(
        description="Example script for {skill_name}"
    )
    parser.add_argument("input", type=Path, help="Input file path")
    parser.add_argument("--verbose", "-v", action="store_true")
    parser.add_argument("--json", action="store_true", help="JSON output")
    parser.add_argument("--no-verify", action="store_true")

    args = parser.parse_args()

    result = process(args.input, {{"verbose": args.verbose}})

    if not args.no_verify and result.success:
        is_valid, msg = verify_result(result)
        if not is_valid:
            print(f"Verification failed: {{msg}}", file=sys.stderr)
            sys.exit(11)

    if args.json:
        print(json.dumps(result.to_dict(), indent=2))
    else:
        print(f"{{result.message}}")

    sys.exit(0 if result.success else 1)


if __name__ == "__main__":
    main()
'''

EXAMPLE_REFERENCE = """# Reference Documentation for {skill_title}

[TODO: Add detailed reference documentation here]

## When to Use References

References are ideal for:
- Comprehensive API documentation
- Detailed workflow guides
- Database schemas
- Information too lengthy for SKILL.md
- Content only needed for specific use cases

## Structure

Organize by topic. Examples:
- `api-reference.md` - External API documentation
- `patterns.md` - Common patterns and examples
- `troubleshooting.md` - Common issues and solutions

Keep SKILL.md lean by moving details here.
"""

EXAMPLE_ASSET = """# Example Asset Placeholder

This directory holds files used in skill output (not loaded into context).

## Common Asset Types

- **Templates:** .pptx, .docx, boilerplate directories
- **Images:** .png, .jpg, .svg
- **Fonts:** .ttf, .otf, .woff2
- **Data:** .csv, .json, .yaml

Replace this file with actual assets or delete if not needed.
"""


# ===========================================================================
# VALIDATION
# ===========================================================================

def validate_skill_name(name: str) -> tuple[bool, str]:
    """
    Validate skill name follows conventions.

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not name:
        return False, "Skill name cannot be empty"

    if len(name) > 64:
        return False, f"Skill name too long ({len(name)} chars, max 64)"

    if not re.match(r'^[a-z][a-z0-9-]*[a-z0-9]$', name) and len(name) > 1:
        if not re.match(r'^[a-z]$', name):
            return False, "Skill name must be hyphen-case (lowercase, hyphens, no leading/trailing hyphens)"

    if '--' in name:
        return False, "Skill name cannot contain consecutive hyphens"

    return True, ""


# ===========================================================================
# INITIALIZATION
# ===========================================================================

def title_case_skill_name(skill_name: str) -> str:
    """Convert hyphenated skill name to Title Case."""
    return ' '.join(word.capitalize() for word in skill_name.split('-'))


def init_skill(skill_name: str, path: str) -> Path | None:
    """
    Initialize a new skill directory with template files.

    Args:
        skill_name: Name of the skill (hyphen-case)
        path: Parent directory for the skill

    Returns:
        Path to created skill directory, or None if error
    """
    # Validate name
    is_valid, error = validate_skill_name(skill_name)
    if not is_valid:
        print(f"❌ Invalid skill name: {error}")
        return None

    skill_dir = Path(path).expanduser().resolve() / skill_name

    # Check if exists
    if skill_dir.exists():
        print(f"❌ Directory already exists: {skill_dir}")
        return None

    # Create directory structure
    try:
        skill_dir.mkdir(parents=True)
        print(f"✅ Created: {skill_dir}")
    except Exception as e:
        print(f"❌ Failed to create directory: {e}")
        return None

    skill_title = title_case_skill_name(skill_name)

    # Create SKILL.md
    try:
        skill_md = skill_dir / 'SKILL.md'
        skill_md.write_text(SKILL_TEMPLATE.format(
            skill_name=skill_name,
            skill_title=skill_title
        ))
        print("✅ Created SKILL.md")
    except Exception as e:
        print(f"❌ Failed to create SKILL.md: {e}")
        return None

    # Create scripts/ with example
    try:
        scripts_dir = skill_dir / 'scripts'
        scripts_dir.mkdir()
        example_script = scripts_dir / 'example.py'
        example_script.write_text(EXAMPLE_SCRIPT.format(skill_name=skill_name))
        example_script.chmod(0o755)
        print("✅ Created scripts/example.py")
    except Exception as e:
        print(f"❌ Failed to create scripts/: {e}")

    # Create references/ with example
    try:
        refs_dir = skill_dir / 'references'
        refs_dir.mkdir()
        example_ref = refs_dir / 'guide.md'
        example_ref.write_text(EXAMPLE_REFERENCE.format(skill_title=skill_title))
        print("✅ Created references/guide.md")
    except Exception as e:
        print(f"❌ Failed to create references/: {e}")

    # Create assets/ with placeholder
    try:
        assets_dir = skill_dir / 'assets'
        assets_dir.mkdir()
        placeholder = assets_dir / 'README.md'
        placeholder.write_text(EXAMPLE_ASSET)
        print("✅ Created assets/README.md")
    except Exception as e:
        print(f"❌ Failed to create assets/: {e}")

    # Success message
    print(f"\n✅ Skill '{skill_name}' initialized at {skill_dir}")
    print("\nNext steps:")
    print("  1. Edit SKILL.md - complete all [TODO] sections")
    print("  2. Customize or delete example files in scripts/, references/, assets/")
    print("  3. Validate: python scripts/quick_validate.py " + str(skill_dir))
    print("  4. Package:  python scripts/package_skill.py " + str(skill_dir))

    return skill_dir


# ===========================================================================
# CLI
# ===========================================================================

def main():
    if len(sys.argv) < 4 or sys.argv[2] != '--path':
        print("Usage: init_skill.py <skill-name> --path <path>")
        print()
        print("Creates a new skill directory with template files.")
        print()
        print("Arguments:")
        print("  skill-name  Hyphen-case name (e.g., 'my-skill')")
        print("  --path      Parent directory for the skill")
        print()
        print("Skill name requirements:")
        print("  - Lowercase letters, digits, and hyphens only")
        print("  - Must start with a letter")
        print("  - Max 64 characters")
        print("  - No consecutive hyphens")
        print()
        print("Examples:")
        print("  init_skill.py code-review --path ~/.claude/skills")
        print("  init_skill.py api-helper --path ./skills")
        sys.exit(2)

    skill_name = sys.argv[1]
    path = sys.argv[3]

    print(f"🚀 Initializing skill: {skill_name}")
    print(f"   Location: {path}/{skill_name}")
    print()

    result = init_skill(skill_name, path)
    sys.exit(0 if result else 1)


if __name__ == "__main__":
    main()
