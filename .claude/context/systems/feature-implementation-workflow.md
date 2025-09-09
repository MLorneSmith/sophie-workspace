---
id: "feature-implementation-workflow"
title: "Feature Implementation Workflow Guide"
version: "1.0.0"
category: "systems"
description: "Step-by-step guide for implementing features using our CCPM workflow"
tags: ["feature", "workflow", "ccpm", "implementation", "parallel-execution"]
created: "2025-09-09"
last_updated: "2025-09-09"
author: "create-context"
---

# Feature Implementation Workflow Guide

A practical guide to implementing features 3x faster using our integrated CCPM system.

---

## 🎯 Quick Start - Your First Feature

Want to implement a new feature? Here's the complete flow:

```bash
/feature:spec user-profile        # Step 1: Define what to build
/feature:plan user-profile        # Step 2: Design how to build it  
/feature:decompose user-profile   # Step 3: Break into small tasks
/feature:sync user-profile        # Step 4: Create GitHub issues
/feature:start user-profile       # Step 5: Launch parallel execution
```

That's it! Multiple AI agents are now building your feature simultaneously.

---

## 📚 Understanding the Workflow

### Three Simple Stages

Every feature follows this path:

1. **📋 SPECIFICATION** - What are we building and why?
2. **🔨 IMPLEMENTATION** - How will we build it?
3. **✅ EXECUTION** - Let's build it (in parallel!)

### Why This Works

- **No guessing** - Every feature starts with clear requirements
- **Parallel power** - Multiple agents work simultaneously 
- **GitHub memory** - Never lose context between sessions
- **Quality built-in** - Tests and reviews happen automatically

---

## 📝 Step-by-Step Implementation Guide

### Step 1: Create Your Feature Specification

```bash
/feature:spec dark-mode-toggle
```

**What you'll be asked:**
- What problem does this solve?
- Who will use this feature?
- What defines success?
- What's out of scope?

**Creates:** `.claude/specs/dark-mode-toggle.md`

**Pro tip:** Spend time here! Good specs = smooth implementation.

---

### Step 2: Convert to Technical Plan

```bash
/feature:plan dark-mode-toggle
```

**What gets decided:**
- Architecture approach
- Technology choices
- Implementation phases
- Time estimates

**Creates:** `.claude/implementations/dark-mode-toggle/plan.md`

---

### Step 3: Break Into Tasks

```bash
/feature:decompose dark-mode-toggle
```

**Creates individual task files:**
- `001.md` - Set up theme context
- `002.md` - Create toggle component
- `003.md` - Add CSS variables
- `004.md` - Write tests

**Each task includes:**
- Clear description
- Dependencies
- Can it run in parallel?
- Estimated time (1-4 hours)

---

### Step 4: Analyze for Parallel Work

```bash
/feature:analyze dark-mode-toggle
```

**Shows you:**
```
Parallel Streams Available:
  Stream 1: UI Components (002, 003) - 2 hours
  Stream 2: Backend Logic (001) - 1 hour  
  Stream 3: Testing (004) - 1 hour

Sequential: 4 hours
Parallel: 2 hours (2x faster!)
```

---

### Step 5: Sync to GitHub

```bash
/feature:sync dark-mode-toggle
```

**What happens:**
- Creates GitHub issues for tracking
- Links tasks together
- Enables team visibility
- Preserves unlimited context

---

### Step 6: Launch Parallel Execution

```bash
/feature:start dark-mode-toggle
```

**Behind the scenes:**
1. Creates feature branch
2. Assigns specialized agents to tasks
3. Launches multiple agents simultaneously
4. Each agent works on different files

**You'll see:**
```
Launching agents...
✓ react-expert → Task 002 (UI component)
✓ css-expert → Task 003 (styling)  
✓ testing-expert → Task 004 (tests)

Monitoring progress...
```

---

### Step 7: Monitor Progress

```bash
/feature:status dark-mode-toggle
```

**Real-time updates:**
```
Feature: dark-mode-toggle
Progress: ███████░░░ 70%

✅ Task 001: Theme context (done)
🔄 Task 002: Toggle component (80%)
🔄 Task 003: CSS variables (60%)
⏳ Task 004: Tests (waiting for 002)

Time saved: 2 hours
```

---

## 🛠️ Supporting Commands

### Testing Your Feature

```bash
/test              # Run all tests
/test --unit       # Just unit tests
/test --e2e        # End-to-end tests
/write-tests       # Generate new tests
```

### Code Quality

```bash
/codecheck         # Run all quality checks
/code-review       # 6-agent parallel review
/validate-and-fix  # Auto-fix common issues
```

### Git Operations

```bash
/pr               # Create pull request
/git:status       # Check git state
/git:commit       # Commit changes
```

---

## 💡 Best Practices

### When to Use This Workflow

✅ **Perfect for:**
- New features (4+ hours of work)
- Multi-component changes
- Features with clear requirements
- When you need speed + quality

❌ **Skip it for:**
- Quick bug fixes (< 2 hours)
- Single file edits
- Exploratory coding
- Emergency hotfixes

### Making Tasks Parallel-Friendly

**Good Task Design:**
- Works on 1-3 files max
- Takes 1-4 hours
- Clear boundaries
- Minimal dependencies

**Example of parallel-safe tasks:**
```
Task 001: Create React component (files: Button.tsx, Button.css)
Task 002: Add API endpoint (files: api/theme.ts)
Task 003: Update database (files: schema.sql)
```

These can all run simultaneously!

---

## 🚀 Advanced Tips

### Handling Dependencies

Some tasks must wait for others:

```yaml
Task 004: Integration tests
depends_on: [001, 002, 003]  # Waits for all to complete
```

The system handles this automatically!

### Using TodoWrite for Tracking

The TodoWrite tool automatically tracks progress:
- Plans your work
- Marks tasks as in-progress
- Updates when complete
- Only one task in-progress at a time

### Research During Development

Need to understand something better?

```bash
/research "React Context best practices"
```

### Creating Documentation

Document what you learned:

```bash
/create-context --new react-patterns
```

---

## 📊 Performance Gains

### Real World Results

| Feature Type | Traditional | With CCPM | Speed Up |
|-------------|------------|-----------|----------|
| New UI Component | 6 hours | 2 hours | 3x |
| API Integration | 12 hours | 4 hours | 3x |
| Full Feature | 20 hours | 7 hours | 2.8x |

### Why It's Faster

- **No context switching** - Agents stay focused
- **Parallel execution** - Multiple tasks at once
- **No rework** - Clear specs prevent mistakes
- **Smart agents** - Specialists for each task

---

## 🔧 Troubleshooting

### Common Issues

**"Tasks aren't running in parallel"**
- Check task files for `parallel: true`
- Ensure tasks modify different files
- Verify dependencies are met

**"GitHub sync failed"**
- Check your GitHub token
- Verify repository permissions
- Make sure you're on a feature branch

**"Lost context between sessions"**
- Run `/feature:status` to restore
- Check GitHub issues for history
- Look in `.claude/implementations/`

---

## 🎮 Interactive Examples

### Example 1: Simple UI Feature

```bash
# Monday morning - start the feature
/feature:spec add-user-avatar

# After lunch - implement it
/feature:plan add-user-avatar
/feature:decompose add-user-avatar
/feature:start add-user-avatar

# Tuesday - check progress
/feature:status add-user-avatar
# All done! Create PR
/pr
```

### Example 2: Complex Integration

```bash
# Research phase
/research "Stripe payment integration"

# Planning phase  
/feature:spec payment-processing
/feature:plan payment-processing

# Implementation
/feature:decompose payment-processing
/feature:sync payment-processing  # Team visibility
/feature:start payment-processing

# Monitor over time
/feature:status payment-processing
/feature:update payment-processing  # Update GitHub
```

---

## 🔑 Key Principles to Remember

1. **Always start with a spec** - No "vibe coding"
2. **Trust the process** - The workflow prevents common mistakes
3. **Let agents work in parallel** - Don't micromanage
4. **Use TodoWrite** - It tracks everything automatically
5. **Sync to GitHub** - Unlimited memory + team visibility
6. **Test continuously** - Quality is built-in

---

## 📖 Reference

### Command Cheat Sheet

```bash
# Core workflow
/feature:spec <name>      # Define what
/feature:plan <name>      # Design how
/feature:decompose <name> # Break down
/feature:sync <name>      # GitHub sync
/feature:start <name>     # Execute

# Status & monitoring
/feature:status <name>    # Check progress
/feature:update <name>    # Update GitHub
/feature:analyze <name>   # See parallelization

# Quality & testing
/test                     # Run tests
/codecheck               # Quality checks
/code-review             # AI review
/pr                      # Pull request
```

### File Locations

```
.claude/
├── specs/                 # Feature specifications
│   └── my-feature.md
├── implementations/       # Implementation plans & tasks
│   └── my-feature/
│       ├── plan.md       # Technical plan
│       ├── 001.md        # Task files
│       └── 002.md
└── context/              # Documentation (like this file)
```

---

## 🎉 You're Ready!

You now know how to implement features 3x faster using our CCPM workflow.

**Next steps:**
1. Try a simple feature first
2. Use `/feature:spec` to start
3. Follow the workflow
4. Enjoy the speed boost!

**Need help?** 
- Check existing examples in `.claude/implementations/`
- Review the CCPM User Guide
- Ask for clarification anytime

Happy building! 🚀