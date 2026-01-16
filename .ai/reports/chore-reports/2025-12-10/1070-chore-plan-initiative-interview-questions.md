# Chore: Update Initiative Interview Questions

## Chore Description

Update the `/initiative` slash command (`.claude/commands/initiative.md`) to improve the interview phase by:

1. **Remove Question 2 (Scope & Constraints)** - This static question with predefined options doesn't add much value and can be inferred from the research phase.

2. **Add a Dynamic Clarification Question** - Generate a context-aware question based on the `initiative-description` argument that helps better understand, flesh out, and define what the initiative is and what the expected result is. This question should be dynamically generated based on parsing the initiative description to identify ambiguous terms, unclear scope boundaries, or missing success criteria.

## Relevant Files

Use these files to resolve the chore:

- `.claude/commands/initiative.md` - The main file to modify; contains the initiative orchestrator workflow with the interview questions in Step 1.2 (lines 127-163)

### Analysis of Current State

The current interview section (lines 127-163) contains three questions:
1. **Question 1: Technologies** - Asks about technologies/libraries involved
2. **Question 2: Scope & Constraints** - Static multiSelect with predefined constraints (to be removed)
3. **Question 3: Feature count expectation** - Asks about expected initiative size

The change requires:
- Removing the static Question 2 block (lines 140-151)
- Adding a new dynamic question that analyzes the `initiative-description` and generates a clarifying question

## Impact Analysis

### Dependencies Affected

- No external packages depend on this file
- No other commands directly import or reference the interview question structure
- The `/initiative-feature-set` and `/initiative-feature` commands receive user responses but don't depend on specific question structure

### Risk Assessment

**Low Risk**:
- This is a self-contained change to a single slash command file
- No database migrations or schema changes
- No breaking changes to external APIs
- The change improves UX without altering the core workflow

### Backward Compatibility

- Fully backward compatible - the workflow continues to gather user input before research
- No migration needed
- Existing initiative workflows in progress are unaffected (each run is independent)

## Pre-Chore Checklist

Before starting implementation:
- [ ] Create feature branch: `chore/initiative-interview-questions`
- [x] Review CHANGELOG for breaking changes (if updating dependencies) - N/A
- [x] Check for deprecation notices in current dependencies - N/A
- [x] Identify all consumers of code being refactored - Only /initiative command
- [x] Backup any critical data (if touching database/migrations) - N/A

## Documentation Updates Required

- No external documentation updates required
- The change is self-documenting within the command file itself
- CLAUDE.md doesn't reference specific interview questions

## Rollback Plan

If issues are discovered:
1. Revert the single commit to `.claude/commands/initiative.md`
2. No database rollback needed
3. No monitoring needed - this is a developer-facing command

## Step by Step Tasks

### Step 1: Create Feature Branch

```bash
git checkout -b chore/initiative-interview-questions
```

### Step 2: Remove Question 2 (Scope & Constraints)

Edit `.claude/commands/initiative.md` to remove lines 140-151 (the Question 2 block):

```typescript
// Question 2: Scope & Constraints  <- REMOVE THIS ENTIRE BLOCK
{
  question: "What constraints should we consider?",
  header: "Constraints",
  multiSelect: true,
  options: [
    { label: "Must integrate with existing auth", description: "Use current auth system" },
    { label: "Performance critical", description: "Needs optimization focus" },
    { label: "Backward compatible", description: "Don't break existing features" },
    { label: "New technology stack", description: "Can use new patterns" }
  ]
}
```

### Step 3: Add Dynamic Clarification Question

Add a new Question 2 that generates a context-aware clarification question. Insert the following after Question 1 (Technologies):

```typescript
// Question 2: Dynamic Clarification (Generated based on initiative description)
//
// INSTRUCTIONS FOR GENERATING THIS QUESTION:
// Analyze the initiative description ($ARGUMENTS) and identify:
// 1. Ambiguous terms that could have multiple interpretations
// 2. Unclear scope boundaries (what's included vs excluded)
// 3. Missing success criteria or expected outcomes
// 4. Technical terms that need clarification for this specific codebase
//
// Generate a single clarifying question that addresses the MOST IMPORTANT
// ambiguity or gap in understanding. The question should help define:
// - What "done" looks like for this initiative
// - The specific behavior or functionality expected
// - Any implicit assumptions that should be made explicit
//
// Example transformations:
// Input: "local-first architecture with RxDB"
// Generated: "Should the local-first sync prioritize offline-first (data available immediately,
//            syncs when online) or real-time collaboration (sync conflicts handled live)?"
//
// Input: "add user analytics dashboard"
// Generated: "What metrics should the analytics dashboard prioritize - engagement metrics
//            (time on page, clicks), business metrics (conversions, revenue), or both?"
//
// Input: "implement dark mode"
// Generated: "Should dark mode follow system preferences automatically, be user-toggled,
//            or support both with a 'system' option?"

// Generate the clarifying question dynamically:
const clarifyingQuestion = generateClarifyingQuestion(initiative);

{
  question: clarifyingQuestion,
  header: "Clarify",
  options: [
    { label: "Option A", description: "<dynamically generated based on question>" },
    { label: "Option B", description: "<dynamically generated based on question>" },
    { label: "Let me explain", description: "I'll provide more context in a follow-up" }
  ]
}
```

### Step 4: Update Question Numbering

Renumber the former "Question 3" to be "Question 3" (it stays the same number since we're replacing, not removing):

The size question remains as Question 3 with no changes needed.

### Step 5: Add Implementation Note for Dynamic Question Generation

Add a note explaining how the dynamic question should be generated. This goes in the Step 1.2 section, before the questions:

```markdown
#### Step 1.2: Interview User

Use AskUserQuestion to gather context. The second question is **dynamically generated** based on the initiative description to clarify ambiguities and define expected outcomes.

**Dynamic Question Generation Algorithm:**
1. Parse the initiative description for key terms
2. Identify the primary domain (auth, data, UI, performance, etc.)
3. Look for ambiguous scope indicators ("add", "implement", "improve")
4. Generate a question that clarifies the most significant ambiguity
5. Provide 2-3 concrete options that represent different valid interpretations
```

### Step 6: Run Validation Commands

Execute the validation commands to ensure the file is properly formatted.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

```bash
# Validate YAML frontmatter is valid (the command file has YAML frontmatter)
head -20 .claude/commands/initiative.md

# Check the file exists and is readable
cat .claude/commands/initiative.md | head -200

# Validate markdown structure (no syntax errors)
pnpm --filter web exec -- npx prettier --check "../.claude/commands/initiative.md" 2>/dev/null || echo "Prettier not configured for .md in this path - manual review OK"

# Verify the Question 2 (Scope & Constraints) has been removed
grep -n "Scope & Constraints" .claude/commands/initiative.md && echo "ERROR: Question 2 not removed" || echo "OK: Question 2 removed"

# Verify dynamic question structure exists
grep -n "Dynamic Clarification\|generateClarifyingQuestion\|Clarify" .claude/commands/initiative.md | head -5

# Run format check on the entire codebase (shouldn't fail due to .md file)
pnpm format

# Run typecheck to ensure no TypeScript issues introduced (shouldn't be affected)
pnpm typecheck
```

## Notes

- The dynamic question generation is a prompt-engineering task - Claude will analyze the initiative description at runtime and generate an appropriate clarifying question
- The question options should be dynamically generated too, representing 2-3 concrete interpretations of the initiative
- The "Let me explain" option should always be present as an escape hatch for complex initiatives
- This change aligns with the goal of reducing static, cookie-cutter questions in favor of context-aware interactions
- The implementation relies on Claude's ability to analyze text and generate relevant questions, which is a core capability
