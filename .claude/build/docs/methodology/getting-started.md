# Getting Started with AAFD v2.0 Methodology

## Quick Start Guide

This guide will walk you through your first feature implementation using the AI-Assisted Feature Development (AAFD) v2.0 methodology.

## Prerequisites

Before you begin, ensure you have:

✅ **SlideHeroes Development Environment**

- Repository cloned and dependencies installed
- Local development environment running (`pnpm dev`)
- Database and services configured

✅ **GitHub Setup**

- GitHub Projects access
- Issue templates configured
- Repository permissions for automation

✅ **Methodology Files**

- All methodology files created (you're here!)
- Context templates available
- Prompt library accessible

## Step 1: Set Up GitHub Projects (15 minutes)

### Create Your Project Board

1. Navigate to your repository → Projects → New Project
2. Choose "Table" view and name it "SlideHeroes Feature Development"
3. Add the following custom fields:

#### Custom Fields Configuration

```
Feature Type: Single Select
- Epic, Story, Task, Bug, Spike

Priority: Single Select
- Critical, High, Medium, Low

Story Points: Single Select
- 1, 2, 3, 5, 8, 13, 21

AI Context Status: Single Select
- Fresh, Loaded, Stale, Needs Refresh

Technical Domain: Multi Select
- Frontend, Backend, Database, AI, DevOps, Testing

Implementation Phase: Single Select
- Analysis, Design, Implementation, Testing, Documentation
```

### Create Project Views

1. **Planning Board** (Kanban)

   - Columns: Idea → PRD → Chunks → Stories → Ready → Blocked
   - Group by: Feature Type
   - Sort by: Priority

2. **Sprint Board** (Kanban)
   - Columns: Ready → In Progress → Review → Done
   - Filter: Current sprint items
   - Group by: Technical Domain

## Step 2: Test with Your First Feature (2-3 hours)

Let's implement a simple feature to test the methodology: **"AI Slide Title Suggestions"**

### Phase 1: Create Epic (15 minutes)

1. **Create Epic Issue**
   - Use GitHub issue template: "Feature Epic"
   - Title: "[EPIC] AI Slide Title Suggestions"
   - Fill out the template with:

```markdown
**Business Context**:
Problem: Users struggle to create compelling slide titles
User Impact: Faster presentation creation with better titles
Business Value: Increased AI feature usage and user engagement

**User Stories**:

- As a SlideHeroes user, I want AI to suggest slide titles so that I can create more compelling presentations
- As a user, I want to apply suggested titles easily so that I can maintain my creative flow

**Acceptance Criteria**:

- [ ] Users can generate AI title suggestions from slide editor
- [ ] Suggestions are relevant to slide content
- [ ] Users can apply suggestions with one click
- [ ] AI usage is tracked for billing
```

2. **Apply Feature Planning Prompt**
   - Load: `/read .claude/build/prompt-library/feature-planning.xml`
   - Use the prompt to create a complete PRD
   - Document the results in the GitHub issue

### Phase 2: Break Into Stories (30 minutes)

1. **Apply Implementation Planning Prompt**

   - Load: `/read .claude/build/prompt-library/implementation-planning.xml`
   - Break the epic into 2-3 implementable stories

2. **Create Story Issues**

   - Use GitHub issue template: "User Story"
   - Create stories like:
     - "[STORY] Generate AI Title Suggestions"
     - "[STORY] Apply Title Suggestions to Slides"
     - "[STORY] Track AI Title Usage"

3. **Set Up Story Context**
   - Copy template: `.claude/build/templates/contexts/story-context-template.md`
   - Create: `.claude/build/contexts/stories/story-001/context.md`
   - Fill in story details and requirements

### Phase 3: Implement First Story (1-2 hours)

1. **Load Development Context**

   ```bash
   # Read AI Engineer session template
   /read .claude/build/contexts/session-templates/ai-engineer.md

   # Load project standards
   /read CLAUDE.md

   # Load story context
   /read .claude/build/contexts/stories/story-001/context.md
   ```

2. **Understand Existing Patterns**

   ```bash
   # Review AI integration patterns
   /read apps/web/app/home/(user)/ai/canvas/_actions/generate-outline.action.ts

   # Review editor components
   /read apps/web/app/home/(user)/editor/_components/SlideEditor.tsx
   ```

3. **Implement the Feature**

   - Create `TitleSuggestionsDialog` component
   - Implement `generateTitleSuggestionsAction` server action
   - Add AI usage tracking
   - Write tests

4. **Update Progress**
   - Document progress in: `.claude/build/contexts/stories/story-001/progress.md`
   - Record technical decisions in: `.claude/build/contexts/stories/story-001/technical-notes.md`

### Phase 4: Review and Retrospective (15 minutes)

1. **Validate Implementation**

   - Test against acceptance criteria
   - Run quality checks (`pnpm typecheck`, `pnpm lint:fix`, `pnpm test`)
   - Verify SlideHeroes patterns followed

2. **Conduct Retrospective**
   - What worked well with the methodology?
   - What was confusing or inefficient?
   - How can the prompts be improved?
   - What context management improvements are needed?

## Step 3: Refine the Methodology (30 minutes)

Based on your first implementation:

1. **Update Prompt Templates**

   - Add SlideHeroes-specific examples
   - Clarify confusing instructions
   - Add missing technical constraints

2. **Improve Context Templates**

   - Add commonly needed fields
   - Improve placeholder text
   - Update file path examples

3. **Document Lessons Learned**
   - Update methodology documentation
   - Create troubleshooting notes
   - Document best practices discovered

## Ongoing Usage

### Daily Workflow

1. **Morning Planning** (5 minutes)

   - Review GitHub Projects board
   - Plan development session focus
   - Load appropriate context

2. **Development Session** (2-4 hours)

   - Load context using session templates
   - Implement using methodology prompts
   - Update progress regularly

3. **End of Session** (5 minutes)
   - Update progress files
   - Document decisions and blockers
   - Plan next session activities

### Weekly Review (15 minutes)

- Review completed features
- Update story point calibration
- Identify methodology improvements
- Plan upcoming features

## Troubleshooting Common Issues

### Context Loading Problems

**Issue**: Context takes too long to load
**Solution**: Create session-specific summaries, batch file reads

**Issue**: Context becomes stale
**Solution**: Use GitHub Actions for staleness detection

### Estimation Problems

**Issue**: Story estimates consistently wrong
**Solution**: Track actual vs estimated time, calibrate point system

### Process Overhead

**Issue**: Methodology feels too heavy
**Solution**: Start with core elements, add complexity gradually

## Resources

### Essential Files

- **Methodology Design**: `.claude/build/methodology-design/methodology-design.md`
- **Implementation Plan**: `.claude/build/methodology-design/methodology-implementation-plan.md`
- **Workflow Guide**: `.claude/build/workflows/development-workflow.md`

### Prompt Library

- **Feature Planning**: `.claude/build/prompt-library/feature-planning.xml`
- **Implementation Planning**: `.claude/build/prompt-library/implementation-planning.xml`
- **Session Loading**: `.claude/build/prompt-library/session-loading.xml`

### Templates

- **Story Context**: `.claude/build/templates/contexts/story-context-template.md`
- **Progress Tracking**: `.claude/build/templates/contexts/progress-template.md`
- **Technical Notes**: `.claude/build/templates/contexts/technical-notes-template.md`

## Getting Help

### Methodology Questions

- Review the methodology design document
- Check existing story implementations for examples
- Experiment with prompt variations

### Technical Issues

- Follow standard SlideHeroes troubleshooting
- Check CLAUDE.md for project standards
- Review existing patterns in similar features

### Process Improvements

- Document issues in methodology retrospectives
- Update templates and prompts based on experience
- Share learnings with team (if applicable)

---

**Next Steps**: Once you've completed your first feature, you're ready to use AAFD v2.0 for all SlideHeroes development. The methodology will improve over time as you refine prompts and processes based on real usage.
