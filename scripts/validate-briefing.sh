#!/bin/bash
# validate-briefing.sh — Validate a composed morning briefing before sending
# Usage: echo "$BRIEFING_TEXT" | ./validate-briefing.sh
#   or:  ./validate-briefing.sh < /tmp/briefing-draft.md
#
# Exits 0 if valid, 1 if errors found. Prints all issues.

set -euo pipefail

BRIEFING=$(cat)
ERRORS=0
WARNINGS=0

echo "🔍 Validating morning briefing..."
echo ""

# ─── CRITICAL CHECKS (block sending) ────────────────────────

# No localhost URLs
if echo "$BRIEFING" | grep -qi "localhost"; then
  echo "❌ CRITICAL: Contains 'localhost' URL — these don't work from Discord!"
  ERRORS=$((ERRORS + 1))
fi

# Calendar section exists - today
if ! echo "$BRIEFING" | grep -qi "today.*meeting\|meeting.*today\|📅.*today"; then
  echo "❌ CRITICAL: Missing 'Today's Meetings' section"
  ERRORS=$((ERRORS + 1))
fi

# Calendar section exists - tomorrow
if ! echo "$BRIEFING" | grep -qi "tomorrow.*meeting\|meeting.*tomorrow\|📅.*tomorrow"; then
  echo "❌ CRITICAL: Missing 'Tomorrow's Meetings' section"
  ERRORS=$((ERRORS + 1))
fi

# Weather section
if ! echo "$BRIEFING" | grep -qi "weather\|🌡️\|toronto"; then
  echo "❌ CRITICAL: Missing Weather section"
  ERRORS=$((ERRORS + 1))
fi

# Quote section
if ! echo "$BRIEFING" | grep -qi "quote.*day\|💬"; then
  echo "❌ CRITICAL: Missing Quote of the Day"
  ERRORS=$((ERRORS + 1))
fi

# AWS costs
if ! echo "$BRIEFING" | grep -qi "aws\|cost\|💰"; then
  echo "❌ CRITICAL: Missing AWS Costs section"
  ERRORS=$((ERRORS + 1))
fi

# Feed items
if ! echo "$BRIEFING" | grep -qi "feed\|picks\|📡"; then
  echo "❌ CRITICAL: Missing Feed Monitor section"
  ERRORS=$((ERRORS + 1))
fi

# Model usage section
if ! echo "$BRIEFING" | grep -qi "model usage\|📊"; then
  echo "❌ CRITICAL: Missing Model Usage section"
  ERRORS=$((ERRORS + 1))
fi

# ─── WARNING CHECKS (flag but don't block) ──────────────────

# Unfilled placeholders
if echo "$BRIEFING" | grep -q '{{[A-Z_]*}}'; then
  PLACEHOLDERS=$(echo "$BRIEFING" | grep -o '{{[A-Z_]*}}' | sort -u | tr '\n' ', ')
  echo "⚠️  WARNING: Unfilled placeholders: $PLACEHOLDERS"
  WARNINGS=$((WARNINGS + 1))
fi

# Overnight section
if ! echo "$BRIEFING" | grep -qi "overnight\|🌙"; then
  echo "⚠️  WARNING: Missing Overnight Work section"
  WARNINGS=$((WARNINGS + 1))
fi

# Sophie suggestions
if ! echo "$BRIEFING" | grep -qi "sophie.*can\|sophie.*today\|✅"; then
  echo "⚠️  WARNING: Missing 'Sophie Can Do Today' section"
  WARNINGS=$((WARNINGS + 1))
fi

# Mike agenda
if ! echo "$BRIEFING" | grep -qi "mike.*should\|mike.*agenda\|📋"; then
  echo "⚠️  WARNING: Missing 'Mike's Agenda' section"
  WARNINGS=$((WARNINGS + 1))
fi

# Capture activity
if ! echo "$BRIEFING" | grep -qi "capture\|📸"; then
  echo "⚠️  WARNING: Missing Capture Activity section"
  WARNINGS=$((WARNINGS + 1))
fi

# ─── Summary ─────────────────────────────────────────────────
echo ""
if [ $ERRORS -gt 0 ]; then
  echo "🚫 FAILED: $ERRORS critical error(s), $WARNINGS warning(s)"
  echo "   Fix critical errors before sending!"
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo "⚠️  PASSED with $WARNINGS warning(s) — review before sending"
  exit 0
else
  echo "✅ PASSED: All checks passed!"
  exit 0
fi
