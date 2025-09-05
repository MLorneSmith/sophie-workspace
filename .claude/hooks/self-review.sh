#!/bin/bash
# Self Review Hook
# Prompts critical self-review questions to catch integration issues
# Adapted from ClaudeKit for shell-based implementation

set -euo pipefail

# Configuration
CONFIG_FILE=".claude/settings.json"
SESSION_DIR=".claude/sessions"
REVIEW_MARKER="📋 **Self-Review**"

# Get payload from stdin
PAYLOAD=$(cat)

# Check if already in a stop hook loop
STOP_HOOK_ACTIVE=$(echo "$PAYLOAD" | jq -r '.stop_hook_active // false')
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  exit 0
fi

# Get session ID and transcript path
SESSION_ID=$(echo "$PAYLOAD" | jq -r '.session_id // ""')
TRANSCRIPT_PATH=$(echo "$PAYLOAD" | jq -r '.transcript_path // ""')

# Create session directory if needed
mkdir -p "$SESSION_DIR"

# Session tracking file
REVIEW_TRACKING_FILE="$SESSION_DIR/.review_tracking_$(echo "$SESSION_ID" | tr '/' '_')"

# Function to check if recent file changes exist
check_recent_changes() {
  # Simple heuristic: check if any source files were modified in last 5 minutes
  # This is a simplified version - ClaudeKit parses the transcript
  
  # Check git status for uncommitted changes
  if command -v git >/dev/null 2>&1; then
    if git status --porcelain 2>/dev/null | grep -qE '^\s*M|^\s*A'; then
      return 0  # Changes found
    fi
  fi
  
  # Check if we've already reviewed in this session
  if [ -f "$REVIEW_TRACKING_FILE" ]; then
    LAST_REVIEW=$(cat "$REVIEW_TRACKING_FILE" 2>/dev/null || echo "0")
    CURRENT_TIME=$(date +%s)
    TIME_DIFF=$((CURRENT_TIME - LAST_REVIEW))
    
    # If reviewed within last 10 minutes, skip
    if [ "$TIME_DIFF" -lt 600 ]; then
      return 1  # Skip review
    fi
  fi
  
  return 0  # Perform review
}

# Check if there are recent changes to review
if ! check_recent_changes; then
  exit 0
fi

# Mark that we're doing a review now
date +%s > "$REVIEW_TRACKING_FILE"

# Define review focus areas with questions
# These are randomly selected to keep reviews fresh
declare -a IMPLEMENTATION_QUESTIONS=(
  "Did you create a mock implementation just to pass tests instead of real functionality?"
  "Are there any 'Not implemented yet' placeholders or TODO comments in production code?"
  "Does the implementation actually do what it claims, or just return hardcoded values?"
  "Did you stub out functionality with placeholder messages instead of real logic?"
  "Are all the features actually working, or just pretending to work?"
  "Did you implement the full solution or just the minimum to make tests green?"
  "Did you finish what you started or leave work half-done?"
)

declare -a QUALITY_QUESTIONS=(
  "Did you leave the code better than you found it?"
  "Is there duplicated logic that should be extracted?"
  "Are you using different patterns than the existing code uses?"
  "Is the code more complex now than it needs to be?"
  "Did you clean up after making your changes work?"
  "Is every piece of code still serving a clear purpose?"
)

declare -a INTEGRATION_QUESTIONS=(
  "Did you just add code on top without integrating it properly?"
  "Should you extract the new functionality into cleaner abstractions?"
  "Would refactoring the surrounding code make everything simpler?"
  "Does the code structure still make sense after your additions?"
  "Should you consolidate similar functions that now exist?"
  "Did you leave any temporary workarounds or hacks?"
)

declare -a CONSISTENCY_QUESTIONS=(
  "Should other parts of the codebase be updated to match your improvements?"
  "Did you update all the places that depend on what you changed?"
  "Are there related files that need the same changes?"
  "Did you create a utility that existing code could benefit from?"
  "Should your solution be applied elsewhere for consistency?"
  "Are you following the same patterns used elsewhere in the codebase?"
)

# Function to select random question from array
select_random_question() {
  local -n arr=$1
  local size=${#arr[@]}
  local index=$((RANDOM % size))
  echo "${arr[$index]}"
}

# Build review message
echo "" >&2
echo "════════════════════════════════════════════════════════════" >&2
echo "$REVIEW_MARKER" >&2
echo "" >&2
echo "Please review these aspects of your changes:" >&2
echo "" >&2

# Select one question from each area
echo "**Implementation Completeness:**" >&2
IMPL_Q=$(select_random_question IMPLEMENTATION_QUESTIONS)
echo "• $IMPL_Q" >&2
echo "" >&2

echo "**Code Quality:**" >&2
QUALITY_Q=$(select_random_question QUALITY_QUESTIONS)
echo "• $QUALITY_Q" >&2
echo "" >&2

echo "**Integration & Refactoring:**" >&2
INTEGRATION_Q=$(select_random_question INTEGRATION_QUESTIONS)
echo "• $INTEGRATION_Q" >&2
echo "" >&2

echo "**Codebase Consistency:**" >&2
CONSISTENCY_Q=$(select_random_question CONSISTENCY_QUESTIONS)
echo "• $CONSISTENCY_Q" >&2
echo "" >&2

# Check if code-review agent is available
if [ -f ".claude/agents/code-review-expert.md" ]; then
  echo "💡 **Tip:** The code-review-expert subagent is available." >&2
  echo "   Use the Task tool with subagent_type: \"code-review-expert\"" >&2
  echo "" >&2
fi

echo "Address any concerns before proceeding." >&2
echo "════════════════════════════════════════════════════════════" >&2

# Output JSON for Stop hook
cat <<EOF
{
  "decision": "block",
  "reason": "Self-review required before session end. Please review the questions above and address any concerns."
}
EOF

exit 0