# Claude Commands Reference

This directory contains orchestration commands that guide complex development workflows.

## Available Commands

### 🚀 `/build-feature` - Feature Development (AAFD v2.0)

**Purpose**: Complete feature development using AAFD v2.0 methodology  
**Usage**: `/build-feature [epic-id|feature-name]`  
**Workflow**: Epic → PRD → Chunks → Stories → Implementation → Review

### 🐛 `/deep-debug` - Complex Issue Resolution

**Purpose**: 3-phase debugging for complex issues  
**Usage**: `/deep-debug [issue-number] [description]`  
**Phases**: Investigation → Root Cause Analysis → Implementation

### 🧪 `/write-unit-tests` - Test Implementation

**Purpose**: Systematically write unit tests with tracking  
**Usage**: `/write-unit-tests [number_of_files]`  
**Default**: 1 file per session

### 📝 `/log-issue` - Issue Tracking

**Purpose**: Log and track bugs or issues  
**Usage**: `/log-issue [description]`  
**Output**: GitHub issue with proper labels

### 🔧 `/debug-issue` - Standard Debugging

**Purpose**: Debug straightforward issues  
**Usage**: `/debug-issue [issue-number]`  
**Workflow**: Analyze → Fix → Verify

## Quick Start

### New Feature Development

```bash
# Start a new feature
/build-feature-v2 "AI Slide Title Suggestions"

# Continue existing feature
/build-feature-v2 21
```

### Issue Resolution

```bash
# Complex debugging
/deep-debug "Application crashes on large file upload"

# Simple issue
/log-issue "Button alignment issue on mobile"
```

### Testing

```bash
# Write tests for high-priority files
/write-unit-tests 3
```

## Command Categories

### 🏗️ Development Commands

- `/build-feature` - Full feature development workflow
- `/write-unit-tests` - Test implementation

### 🐛 Debugging Commands

- `/deep-debug` - Complex issue investigation
- `/debug-issue` - Standard debugging
- `/log-issue` - Issue logging

### 📊 Analysis Commands

- `/analyze-codebase` - Code quality analysis
- `/check-patterns` - Pattern compliance check

## Best Practices

1. **Use `/build-feature` for all new features** - Ensures methodology compliance
2. **Start with `/deep-debug` for complex issues** - Systematic investigation
3. **Run `/write-unit-tests` after feature implementation** - Maintain coverage
4. **Log all bugs with `/log-issue`** - Proper tracking

## Command Details

See individual command files for detailed documentation:

- `build-feature.md` - AAFD v2.0 feature workflow
- `deep-debug.md` - 3-phase debugging process
- `write-unit-tests.md` - Test writing workflow
- `build-feature.md` - Legacy feature command (deprecated)

## Integration

Commands work together:

- `/build-feature` → `/write-unit-tests` → `/log-issue` (if bugs found)
- `/log-issue` → `/deep-debug` (for complex issues)
- `/debug-issue` → `/write-unit-tests` (after fixes)
