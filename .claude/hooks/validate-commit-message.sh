#!/bin/bash
# Validate Commit Message Hook
# Ensures commit messages follow the hybrid format: type(scope): message [agent: name]
# Triggered on: Bash tool with git commit commands

set -euo pipefail

# Get the project root
PROJECT_ROOT="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
CONFIG_FILE="${PROJECT_ROOT}/.claude/settings.json"

# Function to log messages
log() {
    echo "[validate-commit] $*" >&2
}

# Check if this is a git commit operation
if [ -z "${CLAUDE_TOOL:-}" ]; then
    exit 0
fi

# Only run on Bash tool with git commit commands
if [ "$CLAUDE_TOOL" != "Bash" ]; then
    exit 0
fi

# Get the command being executed
COMMAND="${CLAUDE_PARAM_command:-}"

# Only validate git commit commands with -m flag
if ! echo "$COMMAND" | grep -q "git commit.*-m"; then
    exit 0
fi

log "🔍 Validating commit message format..."

# Extract the commit message from the command
# Handle both single and double quotes
COMMIT_MSG=$(echo "$COMMAND" | sed -n 's/.*-m[[:space:]]*["'\'']\(.*\)["'\''].*/\1/p')

if [ -z "$COMMIT_MSG" ]; then
    log "⚠️  Could not extract commit message from command"
    exit 0
fi

log "📝 Commit message: $COMMIT_MSG"

# Valid types
VALID_TYPES="feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert"

# Valid scopes (optional)
VALID_SCOPES="web|payload|e2e|dev-tool|auth|billing|canvas|course|quiz|admin|api|cms|ui|migration|config|deps|tooling|ci|deploy|docker|security"

# Validation patterns
# Pattern 1: type(scope): message [agent: name]
PATTERN_WITH_SCOPE="^($VALID_TYPES)\(($VALID_SCOPES)\):[[:space:]].+\[agent:[[:space:]][a-z_]+\]$"

# Pattern 2: type: message [agent: name] (scope optional)
PATTERN_NO_SCOPE="^($VALID_TYPES):[[:space:]].+\[agent:[[:space:]][a-z_]+\]$"

# Pattern 3: type(scope): message (without agent - also valid)
PATTERN_CONVENTIONAL_WITH_SCOPE="^($VALID_TYPES)\(($VALID_SCOPES)\):[[:space:]].+"

# Pattern 4: type: message (without agent and scope - also valid)
PATTERN_CONVENTIONAL="^($VALID_TYPES):[[:space:]].+"

# Check if message matches any valid pattern
VALID=false
if echo "$COMMIT_MSG" | grep -qE "$PATTERN_WITH_SCOPE"; then
    VALID=true
    log "✅ Format: type(scope): message [agent: name]"
elif echo "$COMMIT_MSG" | grep -qE "$PATTERN_NO_SCOPE"; then
    VALID=true
    log "✅ Format: type: message [agent: name]"
elif echo "$COMMIT_MSG" | grep -qE "$PATTERN_CONVENTIONAL_WITH_SCOPE"; then
    VALID=true
    log "⚠️  Format: type(scope): message (missing agent tag)"
elif echo "$COMMIT_MSG" | grep -qE "$PATTERN_CONVENTIONAL"; then
    VALID=true
    log "⚠️  Format: type: message (missing agent tag and scope)"
fi

if [ "$VALID" = false ]; then
    echo "" >&2
    echo "❌ INVALID COMMIT MESSAGE FORMAT" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2
    echo "" >&2
    echo "Commit message: $COMMIT_MSG" >&2
    echo "" >&2
    echo "REQUIRED FORMAT:" >&2
    echo "  type(scope): description [agent: name]" >&2
    echo "" >&2
    echo "VALID EXAMPLES:" >&2
    echo "  feat(auth): add OAuth2 login [agent: sdlc_implementor]" >&2
    echo "  fix(cms): resolve serialization bug [agent: debug_engineer]" >&2
    echo "  chore(deps): update Next.js [agent: sdlc_planner]" >&2
    echo "  test(e2e): add payment tests [agent: test_writer]" >&2
    echo "" >&2
    echo "VALID TYPES:" >&2
    echo "  feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert" >&2
    echo "" >&2
    echo "VALID SCOPES:" >&2
    echo "  Apps: web, payload, e2e, dev-tool" >&2
    echo "  Features: auth, billing, canvas, course, quiz, admin, api" >&2
    echo "  Technical: cms, ui, migration, config, deps, tooling" >&2
    echo "  Infrastructure: ci, deploy, docker, security" >&2
    echo "" >&2
    echo "COMMON ISSUES:" >&2
    echo "  ❌ Wrong: FEAT(auth): Add login" >&2
    echo "  ✅ Right: feat(auth): add login [agent: implementor]" >&2
    echo "" >&2
    echo "  ❌ Wrong: feat(auth): Added login support." >&2
    echo "  ✅ Right: feat(auth): add login support [agent: implementor]" >&2
    echo "" >&2
    echo "  ❌ Wrong: Added some auth stuff" >&2
    echo "  ✅ Right: feat(auth): add OAuth2 support [agent: implementor]" >&2
    echo "" >&2
    echo "TIP: Use the /commit command for automatic formatting:" >&2
    echo "  /commit sdlc_implementor feat auth" >&2
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" >&2

    # Exit with error code 2 to block the commit
    exit 2
fi

# Additional validations
WARNINGS=()

# Check for sentence case (should start with lowercase after colon)
if echo "$COMMIT_MSG" | grep -qE ":[[:space:]]+[A-Z]"; then
    WARNINGS+=("⚠️  Description should start with lowercase after colon")
fi

# Check for period at end
if echo "$COMMIT_MSG" | grep -qE "\.$"; then
    WARNINGS+=("⚠️  Remove period at end of commit message")
fi

# Check for past tense (common mistakes)
if echo "$COMMIT_MSG" | grep -qiE ":[[:space:]].*(added|fixed|updated|removed|changed|created|deleted)"; then
    WARNINGS+=("⚠️  Use present tense (add, fix, update) not past tense (added, fixed, updated)")
fi

# Check message length (should be 50-72 chars for description)
DESC_ONLY=$(echo "$COMMIT_MSG" | sed 's/\[agent:.*\]$//' | sed 's/^[^:]*:[[:space:]]*//')
DESC_LENGTH=${#DESC_ONLY}
if [ "$DESC_LENGTH" -lt 10 ]; then
    WARNINGS+=("⚠️  Description too short ($DESC_LENGTH chars, should be 10-72)")
elif [ "$DESC_LENGTH" -gt 72 ]; then
    WARNINGS+=("⚠️  Description too long ($DESC_LENGTH chars, should be 10-72)")
fi

# Display warnings if any
if [ ${#WARNINGS[@]} -gt 0 ]; then
    echo "" >&2
    echo "⚠️  COMMIT MESSAGE WARNINGS:" >&2
    for warning in "${WARNINGS[@]}"; do
        echo "  $warning" >&2
    done
    echo "" >&2
    echo "These are warnings only. The commit will proceed." >&2
    echo "Consider fixing these issues for better commit hygiene." >&2
fi

log "✅ Commit message validation passed"
exit 0
