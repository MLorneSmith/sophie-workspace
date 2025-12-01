# Perplexity Research: GitHub Issue Labeling Best Practices

**Date**: 2025-11-28
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary

Researched GitHub issue labeling best practices for a Next.js/TypeScript SaaS project using Supabase with AI-assisted development workflow (slash commands: /diagnose, /feature, /bug-plan, /chore, /implement). Focus on label categories, optimal quantity, naming conventions, color coding, hierarchical vs flat naming, AI workflow integration, and anti-patterns.

## Findings

### 1. Recommended Label Categories

Effective GitHub labeling systems are organized around **4-6 core categories**:

#### Always-Include Categories

**Type/Kind** - What kind of issue is this?
- `type:bug` / `kind:bug` - Bugs, crashes, hangs, vulnerabilities
- `type:feature` / `kind:feature` - New functionality
- `type:enhancement` - Improvements to existing features
- `type:documentation` - Documentation updates
- `type:chore` - Maintenance, refactoring, dependencies

**Priority/Severity** - How important is this issue?
- `priority:critical` / `P0` - Prevents work, data loss, no workaround
- `priority:high` / `P1` - Severely degrades major functionality
- `priority:medium` / `P2` - Impairs non-critical functionality
- `priority:low` / `P3` - Low/no impact on users

**Status/State** - Current workflow state
- `status:ready` - Ready for development
- `status:in-progress` - Currently being worked on
- `status:review` - Ready for review
- `status:blocked` - Waiting on external dependency
- `status:needs-info` - Requires clarification

**Area/Scope** - What part of the product does this affect?
- Project-specific (e.g., `area:auth`, `area:database`, `area:ui`)
- Component-based (e.g., `area:frontend`, `area:backend`, `area:infra`)

#### Supplemental Categories

**Triage Labels**
- `to-triage` - Unprocessed issues
- `needs-more-info` - Requires additional details
- `duplicate` - Similar issue exists

**Community Contribution**
- `good-first-issue` - Beginner-friendly
- `help-wanted` - Seeking contributors

**Platform/Integration** (optional, if applicable)
- `platform:web` / `platform:mobile` / `platform:desktop`
- `integration:github` / `integration:supabase`

### 2. Optimal Number of Labels

**General Guidelines:**
- **Total labels**: 20-40 labels for well-organized project
- **Per issue**: 2-5 labels maximum (avoid visual clutter)
- **Per category**: 3-6 labels recommended

**Anti-Pattern**: 5-10 labels per issue creates visual clutter and reduces focus.

**Recommended Distribution:**
- Type: 4-5 labels (bug, feature, enhancement, docs, chore)
- Priority: 3-4 labels (critical, high, medium, low)
- Status: 5-6 labels (ready, in-progress, review, blocked, needs-info)
- Area: 5-10 labels (project-specific architecture)
- Community: 2-3 labels (good-first-issue, help-wanted)

### 3. Successful Open Source Examples

#### Element (Matrix Protocol)
**Core labels applied to every issue:**
- **Type** (T-Defect, T-Enhancement, T-Task, T-Other)
- **Severity** (S-Critical, S-Major, S-Minor, S-Tolerable) - only for T-Defect
- **Occurrence** (O-Frequent, O-Occasional, O-Uncommon) - defect prevalence
- **Area** (A-* prefixed, e.g., A-Composer, A-Spaces)

#### Creative Commons
**Categories:**
- Priority (urgency + importance)
- Status (ready for work or not)
- Goal (fix, enhancement)
- Aspect (side of project)
- Skill (technical requirements)
- Talk (Q&A, discussion)
- Friendliness (good-first-issue, help-wanted)

#### Continue.dev (AI Code Assistant)
**4 label categories:**
- `area:*` - Application area
- `kind:*` - Issue type
- `ide:*` - IDE-specific (VSCode/JetBrains)
- `priority:*` - Importance

#### freeCodeCamp
Uses hierarchical prefix system (`type:`, `state:`) with consistent color coding across categories.

### 4. Color Coding Best Practices

**Color by Category Strategy:**

Assign **consistent colors to label types** across all repositories:

- **Type labels**: Light green (`#7bc96f`) - noticeable, action-oriented
- **Priority labels**: Warm tones for urgency
  - Critical: Red (`#d73a4a`)
  - High: Orange (`#ff9800`)
  - Medium: Yellow (`#ffd700`)
  - Low: Light blue (`#0075ca`)
- **Status labels**: Light gray (`#e4e669`) - informational, less prominent
- **Area labels**: Distinct colors per area (blue tones for backend, purple for frontend, etc.)
- **Community labels**: Green (`#008672`) for approachability

**Accessibility Considerations:**
- **Use label names/prefixes as primary identifier** (not just color)
- Color should be **secondary visual aid** for colorblind users
- Ensure sufficient contrast for readability
- Psychological alignment: warm = urgent, cool = informational

**Example Color Scheme:**
```
type:bug          → #d73a4a (red)
type:feature      → #a2eeef (light blue)
type:enhancement  → #7bc96f (green)
type:docs         → #0075ca (blue)
type:chore        → #fef2c0 (light yellow)

priority:critical → #d73a4a (red)
priority:high     → #ff9800 (orange)
priority:medium   → #ffd700 (yellow)
priority:low      → #0075ca (blue)

status:ready      → #7bc96f (green)
status:in-progress→ #fbca04 (yellow)
status:review     → #0052cc (blue)
status:blocked    → #d73a4a (red)

area:auth         → #b60205 (dark red)
area:database     → #1d76db (blue)
area:ui           → #d876e3 (purple)
area:api          → #0e8a16 (green)
```

### 5. Hierarchical vs Flat Naming

**RECOMMENDATION: Use hierarchical naming (`priority:high` vs `high`)**

#### Hierarchical Naming (`type:bug`, `priority:high`)

**Pros:**
- **Clearer categorization**: Prefixes (`type:`, `priority:`, `state:`) immediately communicate property type
- **Better visual organization**: Users quickly understand available options within each category
- **Improved browsing**: Consistent structure makes scanning easier
- **Scalability**: Prevents confusion as label count grows
- **Prevents ambiguity**: `high` could mean priority/severity/complexity; `priority:high` is explicit

**Cons:**
- Slightly longer names (takes more space)
- Requires initial setup and convention agreement

#### Flat Naming (`bug`, `high`)

**Pros:**
- Simpler, shorter names
- Easier initial setup

**Cons:**
- **Ambiguity**: "urgent" or "important" don't indicate what property they represent
- **Poor scalability**: Confusion increases with label count
- **Reduced collaboration**: Misuse/misunderstanding of label meaning
- **No visual grouping**: Labels appear random rather than categorized

**Industry Standard:**
- **freeCodeCamp** (largest GitHub repos) uses hierarchical: `type:bug`, `state:invalid`
- **Element** uses prefix abbreviations: `T-Defect`, `S-Critical`, `O-Frequent`, `A-Composer`
- **Continue.dev** uses hierarchical: `area:backend`, `kind:bug`, `priority:high`

### 6. Labels for AI-Assisted Workflows

#### Automation & AI-Specific Labels

**AI Activity Labels:**
- `ai:generated` - Content created by AI
- `ai:triage` - Automatically triaged by AI
- `ai:summary` - AI-generated summaries
- `ai:label-suggestion` - AI-recommended labels

**Bot & Automation Labels:**
- `bot` - Bot-related issues
- `automation` - Automated workflow issues
- `automated-label` - Auto-labeled by tools
- `related-issues` - Issues linked by automation

**AI Workflow Status:**
- `ai:pending` - Awaiting AI processing
- `ai:reviewed` - AI analysis complete
- `ai:approved` - AI-validated

#### Slash Command Integration Labels

For `/diagnose`, `/feature`, `/bug-plan`, `/chore`, `/implement` workflow:

**Command-Based Labels:**
- `cmd:diagnose` - Issue needs diagnosis
- `cmd:feature-plan` - Feature planning in progress
- `cmd:bug-plan` - Bug fix planning
- `cmd:chore-plan` - Chore planning
- `cmd:implement` - Implementation in progress

**Agent Labels:**
- `agent:implementor` - Work by implementor agent
- `agent:debugger` - Work by debug agent
- `agent:planner` - Work by planning agent

**Automation Workflow Triggers:**
- `ready-for-automation` - Triggers automated workflow
- `auto-approve` - Auto-approval eligible
- `needs-human-review` - Requires manual review

**Tool Identification:**
- `copilot` - GitHub Copilot assistance
- `claude-code` - Claude Code assistance
- `automated-test` - Auto-generated tests

#### GitHub Actions Integration

Labels can trigger automated workflows:

```yaml
on:
  pull_request:
    types: [labeled]

jobs:
  auto-review:
    if: contains(github.event.pull_request.labels.*.name, 'ai:needs-review')
    runs-on: ubuntu-latest
    steps:
      - name: AI Review
        run: ...
```

**Workflow Control Labels:**
- `do-not-merge` - Prevents auto-merge (fails CI check)
- `stacked-pr` - Part of PR stack (auto-added/removed)
- `chat` - Enables AI chat on issue

### 7. Common Anti-Patterns to Avoid

#### 1. Over-Labeling (Most Common Mistake)
**Problem**: Applying 5-10 labels per issue creates visual clutter
**Solution**: Limit to 2-5 labels per issue; maintain clarity

#### 2. Inconsistent Label Design
**Problem**: Generic names without structure (bug/enhancement vs type:bug/type:enhancement)
**Solution**: Use consistent prefixes (`type:`, `state:`, `priority:`)

#### 3. Inconsistent Color Assignment
**Problem**: Same label types using different colors
**Solution**: All `type:*` labels same color, all `state:*` labels same color

#### 4. Lack of Label Categories
**Problem**: Fragmented labeling without clear organization
**Solution**: Establish Type, Priority, Status, Area categories upfront

#### 5. Poor Triage Workflow Integration
**Problem**: No `to-triage` or `needs-more-info` labels
**Solution**: Implement triage labels to manage new issues systematically

#### 6. Not Using GitHub Actions
**Problem**: Manual label application leads to inconsistency
**Solution**: Automate label application via GitHub Actions

#### 7. Label Debt (Abandoning Cleanup)
**Problem**: Accumulating unused/redundant labels
**Solution**: Periodic review and cleanup; remove unused labels

#### 8. No Documentation
**Problem**: Contributors don't understand label meanings
**Solution**: Document labeling system in CONTRIBUTING.md or wiki

#### 9. Too Many Labels
**Problem**: 50+ labels overwhelming system
**Solution**: Keep to 20-40 labels; merge redundant labels

#### 10. Missing Descriptions
**Problem**: Labels without descriptions cause confusion
**Solution**: Add clear descriptions to every label

## Concrete Recommendations for SlideHeroes

Based on the AI-assisted workflow (`/diagnose`, `/feature`, `/bug-plan`, `/chore`, `/implement`):

### Recommended Label Set (35 labels)

#### Type (5 labels)
```
type:bug          #d73a4a  "Bugs, crashes, unexpected behavior"
type:feature      #a2eeef  "New functionality or significant additions"
type:enhancement  #7bc96f  "Improvements to existing features"
type:chore        #fef2c0  "Maintenance, refactoring, dependencies"
type:docs         #0075ca  "Documentation updates"
```

#### Priority (4 labels)
```
priority:critical #d73a4a  "Prevents work, data loss, no workaround"
priority:high     #ff9800  "Severely degrades functionality"
priority:medium   #ffd700  "Impairs non-critical functionality"
priority:low      #0075ca  "Low impact on users"
```

#### Status (6 labels)
```
status:triage     #ededed  "Needs initial assessment"
status:planning   #bfdadc  "Planning phase (feature/bug/chore plan)"
status:ready      #7bc96f  "Ready for implementation"
status:in-progress#fbca04  "Currently being worked on"
status:review     #0052cc  "Ready for review"
status:blocked    #d73a4a  "Waiting on external dependency"
```

#### Area (8 labels - based on SlideHeroes architecture)
```
area:auth         #b60205  "Authentication & authorization"
area:billing      #0e8a16  "Payment & subscription features"
area:canvas       #d876e3  "Slide canvas & editor"
area:course       #1d76db  "Course management"
area:quiz         #f9d0c4  "Quiz features"
area:cms          #5319e7  "Payload CMS integration"
area:database     #006b75  "Supabase & database"
area:infra        #c2e0c6  "Infrastructure & deployment"
```

#### Workflow (6 labels - AI/automation)
```
cmd:diagnose      #0e8a16  "Needs diagnosis (/diagnose)"
cmd:plan          #1d76db  "Planning phase (/feature, /bug-plan, /chore)"
cmd:implement     #fbca04  "Implementation phase (/implement)"
ai:automated      #ededed  "Automated by AI agent"
needs-human-review#ff9800  "Requires manual review"
do-not-merge      #d73a4a  "Blocks merging (fails CI)"
```

#### Community (3 labels)
```
good-first-issue  #008672  "Good for newcomers"
help-wanted       #008672  "Seeking contributors"
question          #d876e3  "Question or discussion"
```

#### Special (3 labels)
```
stacked-pr        #fbca04  "Part of PR stack (auto-labeled)"
needs-docs        #0075ca  "Documentation needed"
breaking-change   #d73a4a  "Breaking API change"
```

### Implementation Strategy

1. **Create labels** via GitHub CLI or UI
2. **Document in CONTRIBUTING.md** with color codes and descriptions
3. **Set up GitHub Actions** to auto-label:
   - Stacked PRs (auto-detect base branch)
   - `do-not-merge` (fail CI when present)
   - Auto-add `cmd:*` labels based on slash command usage
4. **Integrate with slash commands** to auto-apply workflow labels
5. **Enable AI auto-labeling** for type/area/priority (GitHub Models or third-party)

### GitHub Actions Automation Examples

**Auto-label stacked PRs:**
```yaml
on:
  pull_request:
    types: [opened, synchronize, edited]

jobs:
  label-stacked:
    runs-on: ubuntu-latest
    steps:
      - if: github.base_ref != 'main'
        uses: actions-ecosystem/action-add-labels@v1
        with:
          labels: stacked-pr
      - if: github.base_ref == 'main'
        uses: actions-ecosystem/action-remove-labels@v1
        with:
          labels: stacked-pr
```

**Block merge on `do-not-merge`:**
```yaml
on:
  pull_request:
    types: [labeled, unlabeled]

jobs:
  block-merge:
    if: contains(github.event.pull_request.labels.*.name, 'do-not-merge')
    runs-on: ubuntu-latest
    steps:
      - name: Fail check
        run: |
          echo "PR labeled 'do-not-merge' - cannot merge"
          exit 1
```

## Key Takeaways

1. **Use hierarchical naming** (`type:bug` vs `bug`) for clarity and scalability
2. **Limit to 20-40 total labels**, 2-5 per issue to avoid clutter
3. **Consistent color coding** by category (all `type:*` same color, all `priority:*` same color)
4. **Always include**: Type, Priority, Status, Area categories
5. **AI workflow labels**: Add `cmd:*`, `ai:*`, automation triggers for slash commands
6. **Automate with GitHub Actions**: Stacked PRs, do-not-merge, auto-triage
7. **Document everything**: Label descriptions, CONTRIBUTING.md, wiki
8. **Avoid anti-patterns**: Over-labeling, inconsistent naming, no cleanup

## Sources & Citations

1. Dosu Blog - Open Source Labeling Best Practices: https://dosu.dev/blog/open-source-labeling-best-practices
2. GitHub Docs - Managing Labels: https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/managing-labels
3. GitHub Docs - Encouraging Contributions with Labels: https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/encouraging-helpful-contributions-to-your-project-with-labels
4. GitHub Docs - Projects Best Practices: https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/best-practices-for-projects
5. Jesse Squires - Label-based GitHub Actions Workflows: https://www.jessesquires.com/blog/2021/08/24/useful-label-based-github-actions-workflows/
6. WOX Blog - Organizing and Tagging GitHub Issues: https://woxday.com/blog/best-practices-for-organizing-and-tagging-github-issues
7. GitHub Changelog - AI Labeler with GitHub Models: https://github.blog/changelog/2025-09-05-github-actions-ai-labeler-and-moderator-with-the-github-models-inference-api/
8. Dev.to - Auto-Label-Pulls GitHub Action: https://dev.to/shiftescape/stay-organized-and-efficient-with-auto-label-pulls-github-action-29pi

## Related Searches

- GitHub Actions auto-labeling implementations
- AI-powered issue triage systems
- Label organization for monorepos
- GitHub Projects + labels integration
- Automated PR review workflows with labels
