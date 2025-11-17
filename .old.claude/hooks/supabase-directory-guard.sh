#!/bin/bash

# Supabase Directory Guard Hook
# Prevents Supabase commands from being run in the wrong directory
# This prevents creating the incorrect "2025slideheroes" stack instead of "2025slideheroes-db"

# Get the command from environment variable (set by Claude Code)
COMMAND="$CLAUDE_TOOL_ARGS_COMMAND"

# Check if this is a Supabase command
if [[ "$COMMAND" =~ (^|[[:space:]])(npx[[:space:]]+)?supabase[[:space:]] ]]; then
    # Get current directory
    CURRENT_DIR="$(pwd)"
    PROJECT_ROOT="/home/msmith/projects/2025slideheroes"

    # Check if we're in the project root
    if [[ "$CURRENT_DIR" == "$PROJECT_ROOT" ]]; then
        echo "🚨 SUPABASE DIRECTORY WARNING"
        echo "================================================"
        echo "❌ You're running a Supabase command from the project root."
        echo "📁 Current directory: $CURRENT_DIR"
        echo ""
        echo "⚠️  This will create/use the WRONG stack: '2025slideheroes'"
        echo "✅ You should run Supabase commands from: apps/web/ or apps/e2e/"
        echo ""
        echo "🔧 Correct usage:"
        echo "   cd apps/web && npx supabase start    # For main development"
        echo "   cd apps/e2e && npx supabase start    # For E2E testing"
        echo ""
        echo "🛑 Command blocked to prevent incorrect stack creation."
        echo "================================================"
        exit 1
    fi

    # Additional check: if we're in apps/web or apps/e2e, show confirmation
    if [[ "$CURRENT_DIR" =~ /apps/(web|e2e)$ ]]; then
        APP_TYPE="${BASH_REMATCH[1]}"
        if [[ "$APP_TYPE" == "web" ]]; then
            STACK_NAME="2025slideheroes-db (ports 39000-39006)"
        else
            STACK_NAME="2025slideheroes-e2e (ports 55321-55322)"
        fi
        echo "✅ Supabase command approved - using correct stack: $STACK_NAME"
    fi
fi

# Command is allowed to proceed
exit 0