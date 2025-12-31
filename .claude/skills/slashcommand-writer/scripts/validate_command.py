#!/usr/bin/env python3
"""
Slash Command Validator

Validates Claude Code slash command files for structure and frontmatter.

Usage:
    python validate_command.py <command-file.md>

Exit Codes:
    0  - Valid command
    1  - Error (invalid syntax, missing required sections)
    10 - Validation warnings (non-critical issues)
"""

import sys
import re
import argparse
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


@dataclass
class ValidationResult:
    """Result of command validation."""
    success: bool
    errors: list[str]
    warnings: list[str]
    command_name: str
    command_type: Optional[str] = None


def parse_frontmatter(content: str) -> tuple[dict, str]:
    """Extract YAML frontmatter and body from markdown content."""
    frontmatter = {}
    body = content

    # Match YAML frontmatter between --- delimiters
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', content, re.DOTALL)

    if match:
        yaml_content = match.group(1)
        body = match.group(2)

        # Simple YAML parsing (handles common cases)
        for line in yaml_content.split('\n'):
            line = line.strip()
            if ':' in line and not line.startswith('#'):
                key, _, value = line.partition(':')
                key = key.strip()
                value = value.strip()

                # Handle arrays
                if value.startswith('[') and value.endswith(']'):
                    value = [v.strip().strip('"\'') for v in value[1:-1].split(',')]
                # Handle quoted strings
                elif value.startswith('"') or value.startswith("'"):
                    value = value.strip('"\'')

                frontmatter[key] = value

    return frontmatter, body


def validate_frontmatter(frontmatter: dict) -> tuple[list[str], list[str]]:
    """Validate frontmatter fields."""
    errors = []
    warnings = []

    # Required field: description
    if 'description' not in frontmatter:
        errors.append("Missing required field: 'description'")
    elif len(str(frontmatter['description'])) > 200:
        warnings.append(f"Description is {len(frontmatter['description'])} chars (recommended < 200)")

    # Model validation
    if 'model' in frontmatter:
        valid_models = ['opus', 'haiku', 'sonnet']
        if frontmatter['model'] not in valid_models:
            errors.append(f"Invalid model '{frontmatter['model']}'. Must be one of: {valid_models}")
    else:
        warnings.append("No 'model' specified. Defaults to parent model.")

    # Allowed tools validation
    if 'allowed-tools' in frontmatter:
        tools = frontmatter['allowed-tools']
        if isinstance(tools, str):
            warnings.append("'allowed-tools' should be an array: [Tool1, Tool2]")

    # Argument hint validation
    if 'argument-hint' in frontmatter:
        hint = frontmatter['argument-hint']
        if isinstance(hint, list):
            hint = hint[0] if hint else ''
        if not hint.startswith('[') or not hint.endswith(']'):
            warnings.append("'argument-hint' should be in brackets: [placeholder-text]")

    return errors, warnings


def validate_body(body: str, frontmatter: dict) -> tuple[list[str], list[str]]:
    """Validate command body structure."""
    errors = []
    warnings = []

    # Check for title
    if not re.search(r'^#\s+\w', body, re.MULTILINE):
        errors.append("Missing main title (# Title)")

    # Check for Instructions section
    if '## Instructions' not in body and '## Run' not in body:
        warnings.append("Missing '## Instructions' or '## Run' section")

    # Check for Report section
    if '## Report' not in body:
        warnings.append("Missing '## Report' section")

    # Check for $ARGUMENTS handling if argument-hint exists
    if 'argument-hint' in frontmatter:
        if '$ARGUMENTS' not in body and '$1' not in body and '$2' not in body:
            warnings.append("Has 'argument-hint' but no $ARGUMENTS handling found")

    # Check for common issues
    if 'TODO' in body or 'FIXME' in body:
        warnings.append("Contains TODO/FIXME - command may be incomplete")

    # Detect command type based on content
    command_type = None
    if '## Plan Format' in body or '## GitHub Issue Creation' in body:
        command_type = 'planning'
    elif '## Validation Commands' in body:
        command_type = 'execution'
    elif len(body.split('\n')) < 30:
        command_type = 'utility'
    else:
        command_type = 'standard'

    return errors, warnings, command_type


def validate_command(file_path: Path) -> ValidationResult:
    """Validate a slash command file."""
    errors = []
    warnings = []
    command_type = None

    # Check file exists
    if not file_path.exists():
        return ValidationResult(
            success=False,
            errors=[f"File not found: {file_path}"],
            warnings=[],
            command_name=file_path.stem
        )

    # Check file extension
    if file_path.suffix != '.md':
        errors.append(f"Invalid file extension '{file_path.suffix}'. Must be '.md'")

    # Read content
    content = file_path.read_text(encoding='utf-8')

    # Check for empty file
    if not content.strip():
        return ValidationResult(
            success=False,
            errors=["File is empty"],
            warnings=[],
            command_name=file_path.stem
        )

    # Parse frontmatter
    frontmatter, body = parse_frontmatter(content)

    # Check frontmatter exists
    if not frontmatter:
        errors.append("Missing YAML frontmatter (must start with ---)")
    else:
        fm_errors, fm_warnings = validate_frontmatter(frontmatter)
        errors.extend(fm_errors)
        warnings.extend(fm_warnings)

    # Validate body
    if body:
        body_errors, body_warnings, detected_type = validate_body(body, frontmatter)
        errors.extend(body_errors)
        warnings.extend(body_warnings)
        command_type = detected_type

    # Determine success
    success = len(errors) == 0

    return ValidationResult(
        success=success,
        errors=errors,
        warnings=warnings,
        command_name=file_path.stem,
        command_type=command_type
    )


def main():
    parser = argparse.ArgumentParser(
        description="Validate Claude Code slash command files"
    )
    parser.add_argument(
        'command_file',
        type=Path,
        help="Path to the command .md file to validate"
    )
    parser.add_argument(
        '--quiet', '-q',
        action='store_true',
        help="Only show errors, not warnings"
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help="Output results as JSON"
    )

    args = parser.parse_args()

    result = validate_command(args.command_file)

    if args.json:
        import json
        print(json.dumps({
            'success': result.success,
            'command_name': result.command_name,
            'command_type': result.command_type,
            'errors': result.errors,
            'warnings': result.warnings
        }, indent=2))
    else:
        # Pretty print results
        status = "VALID" if result.success else "INVALID"
        status_symbol = "\u2705" if result.success else "\u274c"

        print(f"\n{status_symbol} Command: {result.command_name} - {status}")

        if result.command_type:
            print(f"   Type: {result.command_type}")

        if result.errors:
            print(f"\n   Errors ({len(result.errors)}):")
            for error in result.errors:
                print(f"   \u274c {error}")

        if result.warnings and not args.quiet:
            print(f"\n   Warnings ({len(result.warnings)}):")
            for warning in result.warnings:
                print(f"   \u26a0\ufe0f  {warning}")

        if result.success and not result.warnings:
            print("   No issues found!")

        print()

    # Exit codes
    if not result.success:
        sys.exit(1)
    elif result.warnings:
        sys.exit(10)
    else:
        sys.exit(0)


if __name__ == '__main__':
    main()
