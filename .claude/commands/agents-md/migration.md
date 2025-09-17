---
description: Migrate AI assistant configuration to AGENTS.md standard with universal compatibility
category: claude-setup
allowed-tools: Bash(mv:*), Bash(ln:*), Bash(ls:*), Bash(test:*), Bash(grep:*), Bash(echo:*), Read, Write, Edit, Bash(diff:*), Bash(cp:*)
argument-hint: "[merge-strategy: auto|backup|selective|manual]"
delegation-targets: git-expert
---

# PURPOSE

Migrate your project to the AGENTS.md universal standard, consolidating AI assistant configurations and creating compatibility symlinks for all major AI development tools.

**OUTCOME**: Single source of truth for AI assistant configuration with automatic symlinks for Claude, Cursor, Cline, Windsurf, Copilot, and others.

# ROLE

Adopt the role of an **AI Configuration Migration Specialist** who:
- Detects and analyzes all AI assistant configuration files
- Intelligently merges conflicting configurations
- Creates proper symlinks for cross-tool compatibility
- Preserves important project-specific instructions
- Ensures zero configuration loss during migration

# INPUTS

Analyze the current AI configuration landscape:

## 1. Current Configuration Files
!`ls -la CLAUDE.md AGENTS.md AGENT.md GEMINI.md .cursorrules .clinerules .windsurfrules .replit.md .github/copilot-instructions.md .idx/airules.md 2>/dev/null | grep -E "(CLAUDE|AGENT|AGENTS|GEMINI|cursor|cline|windsurf|replit|copilot|airules)" || echo "No AI configuration files found"`

## 2. File Content Analysis
```bash
# Detect all AI configuration files
ai_files=()
[ -f "CLAUDE.md" ] && ai_files+=("CLAUDE.md")
[ -f ".cursorrules" ] && ai_files+=(".cursorrules")
[ -f ".clinerules" ] && ai_files+=(".clinerules")
[ -f ".windsurfrules" ] && ai_files+=(".windsurfrules")
[ -f ".github/copilot-instructions.md" ] && ai_files+=(".github/copilot-instructions.md")
[ -f ".replit.md" ] && ai_files+=(".replit.md")
[ -f "GEMINI.md" ] && ai_files+=("GEMINI.md")
[ -f "AGENTS.md" ] && ai_files+=("AGENTS.md")
[ -f "AGENT.md" ] && ai_files+=("AGENT.md")

echo "📊 Found ${#ai_files[@]} AI configuration file(s):"
for file in "${ai_files[@]}"; do
  size=$(ls -lh "$file" 2>/dev/null | awk '{print $5}')
  echo "  • $file ($size)"
done
```

## 3. Content Comparison
```bash
# Check for identical files
if [ ${#ai_files[@]} -gt 1 ]; then
  echo ""
  echo "🔍 Checking for identical files..."
  for i in "${!ai_files[@]}"; do
    for j in $(seq $((i+1)) $((${#ai_files[@]}-1))); do
      if diff -q "${ai_files[$i]}" "${ai_files[$j]}" > /dev/null 2>&1; then
        echo "  ✅ ${ai_files[$i]} = ${ai_files[$j]} (identical)"
      fi
    done
  done
fi
```

## 4. Migration Strategy
```bash
# Parse user preference
strategy="${ARGUMENTS:-auto}"
echo ""
echo "📋 Migration strategy: $strategy"
case $strategy in
  auto) echo "  → Will automatically merge compatible content" ;;
  backup) echo "  → Will keep primary file and backup others" ;;
  selective) echo "  → Will guide through selective content merging" ;;
  manual) echo "  → Will provide step-by-step merge assistance" ;;
  *) echo "  ⚠️ Unknown strategy, defaulting to 'auto'" ;;
esac
```

# METHOD

Execute the migration to AGENTS.md standard:

## Phase 1: Analyze Existing Configuration

```bash
# Check for AGENTS.md already existing
if [ -f "AGENTS.md" ]; then
  echo "⚠️ AGENTS.md already exists!"
  echo "Options:"
  echo "  1. Update symlinks only (keeps existing AGENTS.md)"
  echo "  2. Merge other configs into existing AGENTS.md"
  echo "  3. Backup and recreate from scratch"
  exit 0
fi

# Identify primary configuration file
primary_file=""
if [ -f "CLAUDE.md" ]; then
  primary_file="CLAUDE.md"
elif [ -f ".cursorrules" ]; then
  primary_file=".cursorrules"
elif [ -f ".clinerules" ]; then
  primary_file=".clinerules"
elif [ -f ".github/copilot-instructions.md" ]; then
  primary_file=".github/copilot-instructions.md"
fi

if [ -z "$primary_file" ]; then
  echo "❌ No AI configuration files found"
  echo "💡 Run '/agents-md:init' to create a new AGENTS.md"
  exit 1
fi

echo "📄 Primary configuration: $primary_file"
```

## Phase 2: Handle Multiple Configurations

```bash
# Count unique configuration files
unique_count=0
declare -A file_hashes

for file in "${ai_files[@]}"; do
  if [ -f "$file" ]; then
    hash=$(md5sum "$file" | cut -d' ' -f1)
    if [ -z "${file_hashes[$hash]}" ]; then
      file_hashes[$hash]="$file"
      unique_count=$((unique_count + 1))
    fi
  fi
done

echo "📊 Found $unique_count unique configuration(s)"

# Handle based on uniqueness
if [ $unique_count -eq 1 ]; then
  echo "✅ All configurations are identical - simple migration"

  # Move primary to AGENTS.md
  echo "📦 Creating AGENTS.md from $primary_file..."
  cp "$primary_file" AGENTS.md

elif [ $unique_count -gt 1 ]; then
  echo "⚠️ Multiple unique configurations found"

  case "$strategy" in
    auto)
      echo "🔄 Auto-merging configurations..."
      # Start with primary file
      cp "$primary_file" AGENTS.md

      # Append unique content from other files
      for file in "${ai_files[@]}"; do
        if [ "$file" != "$primary_file" ] && [ -f "$file" ]; then
          echo "" >> AGENTS.md
          echo "# --- Merged from $file ---" >> AGENTS.md
          cat "$file" >> AGENTS.md
        fi
      done
      ;;

    backup)
      echo "💾 Backing up secondary configurations..."
      cp "$primary_file" AGENTS.md

      for file in "${ai_files[@]}"; do
        if [ "$file" != "$primary_file" ] && [ -f "$file" ]; then
          mv "$file" "${file}.bak"
          echo "  • Backed up: ${file} → ${file}.bak"
        fi
      done
      ;;

    *)
      echo "📋 Manual review required"
      echo "Please review and merge configurations manually"
      exit 1
      ;;
  esac
fi
```

## Phase 3: Create Symlinks

```bash
echo ""
echo "🔗 Creating compatibility symlinks..."

# Claude Code
if [ ! -f "CLAUDE.md" ] || [ ! -L "CLAUDE.md" ]; then
  [ -f "CLAUDE.md" ] && mv CLAUDE.md CLAUDE.md.original
  ln -sf AGENTS.md CLAUDE.md
  echo "  ✅ CLAUDE.md → AGENTS.md"
fi

# Cursor
if [ ! -f ".cursorrules" ] || [ ! -L ".cursorrules" ]; then
  [ -f ".cursorrules" ] && [ ! -L ".cursorrules" ] && mv .cursorrules .cursorrules.original
  ln -sf AGENTS.md .cursorrules
  echo "  ✅ .cursorrules → AGENTS.md"
fi

# Cline
if [ ! -f ".clinerules" ] || [ ! -L ".clinerules" ]; then
  [ -f ".clinerules" ] && [ ! -L ".clinerules" ] && mv .clinerules .clinerules.original
  ln -sf AGENTS.md .clinerules
  echo "  ✅ .clinerules → AGENTS.md"
fi

# Windsurf
if [ ! -f ".windsurfrules" ] || [ ! -L ".windsurfrules" ]; then
  [ -f ".windsurfrules" ] && [ ! -L ".windsurfrules" ] && mv .windsurfrules .windsurfrules.original
  ln -sf AGENTS.md .windsurfrules
  echo "  ✅ .windsurfrules → AGENTS.md"
fi

# Replit
if [ ! -f ".replit.md" ] || [ ! -L ".replit.md" ]; then
  [ -f ".replit.md" ] && [ ! -L ".replit.md" ] && mv .replit.md .replit.md.original
  ln -sf AGENTS.md .replit.md
  echo "  ✅ .replit.md → AGENTS.md"
fi

# Gemini
if [ ! -f "GEMINI.md" ] || [ ! -L "GEMINI.md" ]; then
  [ -f "GEMINI.md" ] && [ ! -L "GEMINI.md" ] && mv GEMINI.md GEMINI.md.original
  ln -sf AGENTS.md GEMINI.md
  echo "  ✅ GEMINI.md → AGENTS.md"
fi

# Legacy AGENT.md
if [ ! -f "AGENT.md" ] || [ ! -L "AGENT.md" ]; then
  [ -f "AGENT.md" ] && [ ! -L "AGENT.md" ] && mv AGENT.md AGENT.md.original
  ln -sf AGENTS.md AGENT.md
  echo "  ✅ AGENT.md → AGENTS.md"
fi

# GitHub Copilot
mkdir -p .github
if [ ! -f ".github/copilot-instructions.md" ] || [ ! -L ".github/copilot-instructions.md" ]; then
  [ -f ".github/copilot-instructions.md" ] && [ ! -L ".github/copilot-instructions.md" ] && mv .github/copilot-instructions.md .github/copilot-instructions.md.original
  ln -sf ../AGENTS.md .github/copilot-instructions.md
  echo "  ✅ .github/copilot-instructions.md → ../AGENTS.md"
fi

# Firebase Studio
mkdir -p .idx
if [ ! -f ".idx/airules.md" ] || [ ! -L ".idx/airules.md" ]; then
  [ -f ".idx/airules.md" ] && [ ! -L ".idx/airules.md" ] && mv .idx/airules.md .idx/airules.md.original
  ln -sf ../AGENTS.md .idx/airules.md
  echo "  ✅ .idx/airules.md → ../AGENTS.md"
fi
```

## Phase 4: Verification and Cleanup

```bash
echo ""
echo "✅ Migration completed!"
echo ""
echo "📋 Verification:"

# Show symlinks
echo "Symlinks created:"
ls -la | grep -E "(CLAUDE|AGENT|GEMINI|cursor|cline|windsurf|replit)" | grep " -> "
[ -L ".github/copilot-instructions.md" ] && echo "  .github/copilot-instructions.md -> ../AGENTS.md"
[ -L ".idx/airules.md" ] && echo "  .idx/airules.md -> ../AGENTS.md"

# Show backup files
echo ""
backup_files=$(ls -la *.bak *.original 2>/dev/null | wc -l)
if [ $backup_files -gt 0 ]; then
  echo "📦 Backup files created:"
  ls -la *.bak *.original 2>/dev/null
  echo ""
  echo "💡 Review backups and delete when ready:"
  echo "   rm *.bak *.original"
fi

# Git status
if [ -d .git ]; then
  echo ""
  echo "📝 Git status:"
  git status --short | head -10
  echo ""
  echo "💡 Commit the migration:"
  echo "   git add AGENTS.md CLAUDE.md .cursorrules .clinerules .github/copilot-instructions.md"
  echo "   git commit -m 'chore: migrate to AGENTS.md standard'"
fi
```

# EXPECTATIONS

## Success Criteria
- ✅ AGENTS.md created from existing configurations
- ✅ All AI tools have proper symlinks
- ✅ No configuration data lost
- ✅ Backup files created for safety
- ✅ Git-friendly migration completed
- ✅ All symlinks verified and working

## Supported AI Assistants
After migration, the following tools will use AGENTS.md:
- Claude Code (via CLAUDE.md)
- Cursor (via .cursorrules)
- Cline (via .clinerules)
- Windsurf (via .windsurfrules)
- GitHub Copilot (via .github/copilot-instructions.md)
- Replit (via .replit.md)
- Gemini CLI (via GEMINI.md)
- Firebase Studio (via .idx/airules.md)
- Legacy support (via AGENT.md)

## Verification Commands
```bash
# Verify all symlinks
for link in CLAUDE.md .cursorrules .clinerules .windsurfrules .replit.md GEMINI.md AGENT.md; do
  [ -L "$link" ] && echo "✅ $link → $(readlink $link)"
done

# Check special directory symlinks
[ -L ".github/copilot-instructions.md" ] && echo "✅ .github/copilot-instructions.md → $(readlink .github/copilot-instructions.md)"
[ -L ".idx/airules.md" ] && echo "✅ .idx/airules.md → $(readlink .idx/airules.md)"
```

## Error Handling

### Common Issues

1. **AGENTS.md already exists**
   - Solution: Backup existing, merge, or update symlinks only

2. **No configuration files found**
   - Solution: Run `/agents-md:init` to create new

3. **Permission denied creating symlinks**
   - Solution: Check file permissions and ownership

4. **Symlinks not working on Windows**
   - Solution: Use Git Bash or WSL for proper symlink support

## Help

### Usage Examples

```bash
# Auto-merge all configurations
/agents-md/migration

# Keep primary, backup others
/agents-md/migration backup

# Selective merging
/agents-md/migration selective

# Manual step-by-step
/agents-md/migration manual
```

### Post-Migration

After successful migration:
1. Review AGENTS.md for completeness
2. Test with your AI tools
3. Delete backup files when satisfied
4. Commit changes to version control
5. Share with team members

### Why AGENTS.md?

AGENTS.md is the emerging standard because:
- **Single source of truth** for all AI assistants
- **No duplication** across multiple config files
- **Future-proof** as new AI tools emerge
- **Community-driven** standard

Learn more at [agents.md](https://agents.md)