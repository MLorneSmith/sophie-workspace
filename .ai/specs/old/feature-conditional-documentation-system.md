# Feature: Intelligent Conditional Documentation System

## Feature Description
Create a metadata-driven conditional documentation routing system that intelligently loads only the most relevant context files for each slash command (implement, diagnose, feature, chore, bug-plan). The system uses a three-tier architecture: command profiles (YAML configuration), context metadata (existing YAML frontmatter), and a dynamic router that matches task patterns to documentation needs. This reduces token usage by 40-60% while maintaining or improving task success rates by eliminating context bloat and loading precisely what's needed for each task.

## User Story
As Claude Code executing slash commands
I want to automatically load only the relevant context documentation for each specific task
So that I can work more efficiently with optimal context, reduced token usage, and higher quality outputs without manual documentation selection

## Problem Statement
Currently, the `.claude/commands/conditional_docs.md` file is a basic template from another project (references non-existent paths like `app/server`, `app/client`, `adws/`) that doesn't leverage the rich metadata structure of the 29 context files in `.ai/ai_docs/context-docs/`. This leads to:

1. **Token Inefficiency**: Loading irrelevant documentation wastes tokens and dilutes focus
2. **Manual Selection**: Developers must manually identify which docs to load
3. **Inconsistent Loading**: Different commands may load inconsistent sets of documentation
4. **Maintenance Burden**: No centralized system to map command needs to documentation
5. **Missed Dependencies**: No automatic loading of prerequisite or related documentation

The existing context files have excellent YAML frontmatter with tags, dependencies, and cross-references, but there's no system to intelligently leverage this metadata for conditional loading.

## Solution Statement
Implement a three-tier metadata-driven conditional documentation system:

**Tier 1: Command Profiles** (`.claude/config/command-profiles.yaml`)
- Define documentation needs for each slash command
- Specify default contexts, conditional rules, and category mappings
- Use keyword-based triggers to match task descriptions to documentation

**Tier 2: Context Metadata** (Existing YAML frontmatter)
- Leverage existing tags, dependencies, and cross-references
- No changes needed - already excellent structure

**Tier 3: Dynamic Router** (Enhanced `.claude/commands/conditional_docs.md`)
- Smart routing engine that reads command profiles
- Analyzes task descriptions for keywords and patterns
- Matches keywords to conditional rules
- Resolves dependencies automatically from YAML frontmatter
- Returns prioritized list of 5-7 most relevant documents

The system follows existing patterns in the codebase (YAML config, git scope detection, wrapper scripts) and integrates seamlessly with the current command structure.

## Relevant Files

### Existing Files to Modify
- **`.claude/commands/conditional_docs.md`** - Transform from template to intelligent router
  - Currently: Basic template with outdated paths
  - Will become: Smart routing engine with metadata awareness

- **`.claude/commands/implement.md`** - Update to reference new conditional docs system
  - Add instruction to load conditional_docs for context selection

- **`.claude/commands/diagnose.md`** - Update to reference new conditional docs system
  - Add instruction to load conditional_docs for context selection

- **`.claude/commands/feature.md`** - Update to reference new conditional docs system (this file!)
  - Add instruction to load conditional_docs for context selection

- **`.claude/commands/chore.md`** - Update to reference new conditional docs system
  - Add instruction to load conditional_docs for context selection

- **`.claude/commands/bug-plan.md`** - Update to reference new conditional docs system
  - Add instruction to load conditional_docs for context selection

### New Files
- **`.claude/config/command-profiles.yaml`** - Central configuration mapping commands to documentation needs
  - Profiles for implement, diagnose, feature, chore, bug-plan
  - Default contexts, conditional rules, category mappings
  - Keyword triggers and priority weights

- **`.claude/config/README.md`** - Documentation for the command profiles schema
  - Schema definition and examples
  - How to add new commands or update existing profiles
  - Maintenance guidelines

- **`.claude/bin/doc-router.sh`** - Optional shell script for external routing logic
  - Can be used for advanced conditional logic if needed
  - For Phase 2 optimization

- **`.ai/specs/examples/conditional-docs-usage-examples.md`** - Example usage patterns
  - Real-world examples of how the system routes documentation
  - Test cases for validation

## Impact Analysis

### Dependencies Affected
**No new external dependencies required** - uses existing tools:
- YAML parsing (Claude Code natively handles YAML frontmatter)
- Markdown rendering (existing)
- Git integration (existing for scope detection)
- Bash scripting (optional, for advanced routing)

**Packages consuming this feature:**
- `.claude/commands/implement.md` - Implementation executor
- `.claude/commands/diagnose.md` - Bug diagnosis
- `.claude/commands/feature.md` - Feature planning
- `.claude/commands/chore.md` - Maintenance planning
- `.claude/commands/bug-plan.md` - Bug fix planning
- Future commands can easily integrate

**Internal dependencies:**
- `.ai/ai_docs/context-docs/**/*.md` - All 29 context documentation files
- `.claude/settings.json` - May add optional pre-hook for profile compilation

### Risk Assessment
**Low-Medium Risk**

**Low Risk Factors:**
- No external dependencies
- Non-breaking changes (additive only)
- Uses existing patterns (YAML config, markdown commands)
- Isolated feature (doesn't touch core application code)
- Easy rollback (remove references to conditional_docs)

**Medium Risk Factors:**
- Complexity of routing logic (keyword matching, dependency resolution)
- Potential for incorrect documentation loading if rules are misconfigured
- Maintenance burden if not well-documented
- Performance impact if routing logic is too slow (<1s required)

**Mitigation:**
- Comprehensive test cases with example tasks
- Clear documentation and schema definitions
- Performance benchmarks (must complete in <500ms)
- Gradual rollout (start with one command, expand after validation)

### Backward Compatibility
**Fully backward compatible:**
- Existing commands continue to work without changes
- Manual documentation loading still possible
- conditional_docs.md can be ignored if not called
- No breaking changes to existing workflows

**Migration path:**
- Commands work before and after implementation
- Update commands one at a time to reference conditional_docs
- Optional adoption - commands don't require conditional docs

**Feature flags:**
- Not required - system is opt-in by design
- Commands explicitly call conditional_docs when they want routing

### Performance Impact
**Minimal performance impact:**

**Database:** No database queries

**Client bundle size:** No client-side impact (tooling only)

**Server resources:**
- Router execution: <500ms target
- YAML parsing: negligible (small config files)
- File reading: ~29 markdown files × ~50KB = ~1.45MB total
  - But only loading 5-7 files per task = ~350KB per execution

**Caching considerations:**
- Command profiles loaded once per session
- Context file metadata could be cached after first read
- Optional: Pre-compile profiles to JSON for faster parsing

**Token efficiency gains:**
- Current: Potentially loading all 29 files = ~145,000 tokens
- With conditional docs: Loading 5-7 files = ~35,000-50,000 tokens
- **Net gain: 60-75% token reduction per command execution**

### Security Considerations
**Low security risk - tooling feature only:**

**Authentication/authorization:**
- Not applicable - operates in local development environment
- No user-facing functionality

**Data validation:**
- YAML schema validation for command profiles
- Path validation to prevent directory traversal
- Keyword sanitization to prevent injection

**Potential vulnerabilities:**
- Path injection if user input directly used in file paths
  - Mitigation: Whitelist allowed paths to `.ai/ai_docs/context-docs/`
- YAML parsing vulnerabilities
  - Mitigation: Use standard YAML parsers, no `eval()` or code execution

**Privacy/compliance:**
- No PII or sensitive data
- Local-only operation
- No external API calls

## Pre-Feature Checklist
Before starting implementation:
- [x] Create feature branch: `feature/conditional-documentation-system`
- [x] Review existing similar features for patterns (commit.md scope detection, settings.json config)
- [x] Identify all integration points (5 slash commands + conditional_docs.md)
- [x] Define success metrics (token efficiency 40-60%, maintain task success rate, easier maintenance)
- [x] Confirm feature doesn't duplicate existing functionality (no existing intelligent routing)
- [x] Verify all required dependencies are available (YAML parsing, markdown, git - all available)
- [ ] Plan feature flag strategy (not needed - opt-in by design)

## Documentation Updates Required

### Technical Documentation
- **`.claude/config/README.md`** (new) - Command profiles schema and usage
- **`.ai/specs/examples/conditional-docs-usage-examples.md`** (new) - Example patterns
- **`CLAUDE.md`** - Add section on conditional documentation system
  - How to use the system
  - How to add new command profiles
  - How to update routing rules

### User-Facing Documentation
- **`.ai/ai_docs/context-docs/README.md`** - Update to mention conditional loading system
- **`.ai/ai_docs/context-docs/development/README.md`** - Update with routing information
- **`.ai/ai_docs/context-docs/infrastructure/README.md`** - Update with routing information
- **`.ai/ai_docs/context-docs/testing+quality/README.md`** - Update with routing information

### Code Comments
- Inline documentation in `conditional_docs.md` explaining routing algorithm
- Comments in `command-profiles.yaml` explaining each rule

### API Documentation
- Not applicable - internal tooling feature

### Component Documentation
- Not applicable - no UI components

## Rollback Plan

### How to Disable
**Simple rollback - remove references:**
1. Revert changes to the 5 slash commands (implement, diagnose, feature, chore, bug-plan)
2. Remove instruction to load `conditional_docs.md`
3. Commands return to manual documentation selection

**Graceful degradation:**
- If `conditional_docs.md` fails or returns no results, commands can proceed without conditional loading
- Commands should have fallback: "Proceeding without conditional documentation"

### Database Migration Rollback
Not applicable - no database changes

### Monitoring
**What to monitor:**
- Command execution success rates (should maintain 100%)
- Token usage per command (should decrease by 40-60%)
- Router execution time (should be <500ms)
- Error rates in conditional_docs.md

**Detection mechanisms:**
- Manual validation after implementation
- Comparison of before/after token usage
- User feedback (did task succeed?)

### Graceful Degradation Strategy
```markdown
# In each slash command:

## Conditional Documentation Loading (Optional)
Try to load conditional documentation. If it fails, proceed without it.

```
If conditional_docs.md returns error or empty:
- Log warning: "Conditional documentation routing failed, proceeding without context optimization"
- Continue command execution with manual doc selection or defaults
```

## Implementation Plan

### Phase 1: Foundation (Infrastructure Setup)
1. **Create configuration structure**
   - Create `.claude/config/` directory
   - Create `.claude/bin/` directory for optional scripts
   - Set up README template for documentation

2. **Design command profiles schema**
   - Define YAML structure for command profiles
   - Specify required fields (command, defaults, rules, categories)
   - Create schema documentation

3. **Inventory existing context files**
   - Parse all 29 context files for metadata
   - Build tag vocabulary (all unique tags)
   - Map dependency chains
   - Document cross-reference patterns

### Phase 2: Core Implementation (Routing Engine)
1. **Build command profiles**
   - Create profiles for 5 commands (implement, diagnose, feature, chore, bug-plan)
   - Define keyword triggers based on command purpose
   - Map categories to documentation sets
   - Set priority weights

2. **Implement routing algorithm**
   - Enhance `conditional_docs.md` with smart routing logic
   - Implement keyword matching
   - Add dependency resolution (read YAML frontmatter)
   - Add prioritization logic (limit to 5-7 files)
   - Handle edge cases (no matches, too many matches)

3. **Create fallback mechanisms**
   - Default contexts when no matches found
   - Error handling for missing files
   - Graceful degradation if routing fails

### Phase 3: Integration (Command Updates)
1. **Integrate with slash commands**
   - Update implement.md to call conditional_docs
   - Update diagnose.md to call conditional_docs
   - Update feature.md to call conditional_docs
   - Update chore.md to call conditional_docs
   - Update bug-plan.md to call conditional_docs

2. **Create usage examples**
   - Document example tasks and expected routing results
   - Create test cases for validation

3. **Update project documentation**
   - Add section to CLAUDE.md
   - Update context-docs README files
   - Document maintenance procedures

## Step by Step Tasks

### 1. Create Directory Structure and Configuration Foundation

- Create `.claude/config/` directory for centralized configuration
- Create `.claude/bin/` directory for optional routing scripts
- Create `.claude/config/README.md` with schema documentation template
- Document the command profile YAML schema with field definitions
- Document maintenance procedures for updating profiles

### 2. Inventory and Analyze Context Documentation Metadata

- Read all 29 context files from `.ai/ai_docs/context-docs/` and parse YAML frontmatter
- Build comprehensive tag vocabulary (extract all unique tags across files)
- Map dependency chains (which files depend on which)
- Document cross-reference patterns (related, prerequisite, parent relationships)
- Create a metadata summary report for reference

### 3. Design and Create Command Profiles Configuration

- Create `.claude/config/command-profiles.yaml` with the following structure:
  ```yaml
  profiles:
    implement:
      description: "Execute implementation plans from GitHub issues"
      defaults: ["development/architecture-overview.md"]
      rules: [...]
      categories: {...}
    diagnose:
      description: "Investigate and document root causes of bugs"
      defaults: [...]
      rules: [...]
      categories: {...}
    # ... (feature, chore, bug-plan)
  ```
- Define keyword triggers for each command based on common task patterns
- Map category names to documentation file lists
- Set priority weights for different match types

### 4. Build Command Profile for /implement Command

- Define default contexts: `architecture-overview.md`
- Create conditional rules for:
  - Database work (keywords: database, migration, schema, RLS, postgres)
  - Auth work (keywords: auth, login, signup, permission, role)
  - Server actions (keywords: server action, mutation, form, validation)
  - UI work (keywords: component, UI, form, button, shadcn)
  - Testing (keywords: test, spec, e2e, unit)
- Map categories: frontend, backend, infrastructure
- Document rationale for each rule

### 5. Build Command Profile for /diagnose Command

- Define default contexts: `architecture-overview.md`
- Create conditional rules for:
  - Database issues (keywords: RLS, query, timeout, database error)
  - Auth issues (keywords: unauthorized, 401, 403, auth error, login failed)
  - Server errors (keywords: 500, internal server error, API error)
  - Container issues (keywords: docker, container, unhealthy)
  - Build failures (keywords: build failed, compilation error, type error)
  - Deployment issues (keywords: deploy, vercel, production error)
- Map troubleshooting docs: auth-troubleshooting, docker-troubleshooting
- Document rationale for each rule

### 6. Build Command Profiles for /feature, /chore, /bug-plan Commands

- **Feature profile**: architecture patterns, design docs, implementation guides
- **Chore profile**: infrastructure docs, tooling, dependency management
- **Bug-plan profile**: similar to diagnose but focused on solution design
- Create conditional rules for each command
- Map categories appropriately
- Document rationale

### 7. Implement Core Routing Algorithm in conditional_docs.md

- Transform `.claude/commands/conditional_docs.md` from template to smart router
- Implement task analysis: extract keywords from task description
- Implement keyword matching: compare task keywords to profile rules
- Implement scoring/ranking: prioritize matches by relevance
- Implement dependency resolution: read YAML frontmatter and auto-load dependencies
- Implement result limiting: cap at 5-7 most relevant files
- Add comprehensive inline documentation

### 8. Implement Fallback and Error Handling

- Add default context loading if no matches found
- Handle missing command profiles gracefully
- Handle missing documentation files gracefully
- Add clear error messages for debugging
- Implement graceful degradation (command continues even if routing fails)
- Add logging for troubleshooting

### 9. Create Usage Examples and Test Cases

- Create `.ai/specs/examples/conditional-docs-usage-examples.md`
- Document 10+ example tasks with expected routing results:
  - Example: "Add OAuth2 social login" → auth-overview, auth-implementation, server-actions
  - Example: "Fix database query timeout" → database-patterns, architecture-overview
  - Example: "Add dark mode toggle" → shadcn-ui-components, react-query-patterns
- Include edge cases (no matches, ambiguous tasks, multiple categories)
- Create validation test cases

### 10. Integrate with /implement Slash Command

- Update `.claude/commands/implement.md` to reference conditional_docs
- Add instruction: "Load relevant context using conditional_docs based on the plan"
- Test with sample implementation task
- Verify correct documentation is loaded
- Document integration in command comments

### 11. Integrate with /diagnose Slash Command

- Update `.claude/commands/diagnose.md` to reference conditional_docs
- Add instruction: "Load relevant context using conditional_docs based on the issue"
- Test with sample bug diagnosis task
- Verify correct documentation is loaded
- Document integration in command comments

### 12. Integrate with /feature Slash Command

- Update `.claude/commands/feature.md` (this command!) to reference conditional_docs
- Add instruction: "Load relevant context using conditional_docs based on the feature description"
- Test with sample feature planning task
- Verify correct documentation is loaded
- Document integration in command comments

### 13. Integrate with /chore and /bug-plan Slash Commands

- Update `.claude/commands/chore.md` to reference conditional_docs
- Update `.claude/commands/bug-plan.md` to reference conditional_docs
- Test both commands with sample tasks
- Verify correct documentation is loaded
- Document integration in command comments

### 14. Update Project Documentation (CLAUDE.md)

- Add new section to `CLAUDE.md`: "## Conditional Documentation System"
- Document the three-tier architecture
- Explain how to use the system
- Explain how to add new command profiles
- Explain how to update routing rules
- Document maintenance procedures
- Add troubleshooting guide

### 15. Update Context Documentation READMEs

- Update `.ai/ai_docs/context-docs/README.md` to mention conditional loading system
- Update `.ai/ai_docs/context-docs/development/README.md` with routing information
- Update `.ai/ai_docs/context-docs/infrastructure/README.md` with routing information
- Update `.ai/ai_docs/context-docs/testing+quality/README.md` with routing information
- Add "How files are selected" section to each README

### 16. Create Comprehensive Tests

- Write unit tests for keyword matching logic (if using shell script)
- Write integration tests: full routing from task → documentation list
- Create test suite with 20+ test cases covering:
  - All command profiles
  - Various task types
  - Edge cases (no matches, many matches, missing files)
  - Dependency resolution
  - Cross-reference following
- Document test execution instructions

### 17. Validate Performance and Token Efficiency

- Benchmark routing execution time (must be <500ms)
- Measure token usage before/after for sample tasks:
  - Measure baseline: manual documentation loading
  - Measure optimized: conditional documentation loading
  - Calculate percentage improvement (target: 40-60% reduction)
- Optimize if needed (caching, pre-compilation)
- Document performance metrics

### 18. Run Full Validation Suite

- Execute all test cases from usage examples
- Test each slash command integration:
  - `/implement` with sample GitHub issue
  - `/diagnose` with sample bug report
  - `/feature` with sample feature request
  - `/chore` with sample maintenance task
  - `/bug-plan` with sample diagnosed bug
- Verify correct documentation loaded for each
- Verify commands complete successfully
- Verify no regressions in existing functionality

### 19. Run Validation Commands

- Run `pnpm lint:fix` to fix any linting issues
- Run `pnpm format:fix` to format all new/modified files
- Run `pnpm typecheck` (should pass - no TypeScript in this feature)
- Manually test each command integration
- Review all documentation for completeness

## Testing Strategy

### Unit Tests
**Not applicable for this feature** - primarily configuration and markdown-based routing logic. However, if implementing optional bash script router (`.claude/bin/doc-router.sh`), unit tests would include:

- Keyword extraction from task descriptions
- Keyword matching against profile rules
- Scoring and ranking of matches
- YAML parsing correctness
- Path validation and sanitization

### Integration Tests
**Primary testing focus** - validate end-to-end routing:

1. **Profile Loading Tests**
   - Load command-profiles.yaml successfully
   - Parse all profiles correctly
   - Handle missing profile gracefully

2. **Routing Logic Tests**
   - Given a task description + command, return correct documentation list
   - Test all 5 command profiles (implement, diagnose, feature, chore, bug-plan)
   - Test 20+ task variations per command

3. **Dependency Resolution Tests**
   - Load a file with dependencies → verify dependencies auto-loaded
   - Test dependency chains (A depends on B, B depends on C)
   - Handle circular dependencies gracefully

4. **Edge Case Tests**
   - No keyword matches → verify default contexts loaded
   - Too many matches → verify limited to 5-7 files
   - Missing documentation file → handle gracefully
   - Empty task description → load defaults

5. **Command Integration Tests**
   - Call each slash command with conditional_docs enabled
   - Verify correct documentation loaded
   - Verify command completes successfully

### E2E Tests
**Manual validation** - test with real-world scenarios:

1. **Feature Implementation Workflow**
   - User requests: "Add OAuth2 social login"
   - Run `/feature` command
   - Verify conditional_docs loads: auth-overview, auth-implementation, auth-security, server-actions
   - Verify feature plan created successfully

2. **Bug Diagnosis Workflow**
   - User reports: "Database query timeout on projects page"
   - Run `/diagnose` command
   - Verify conditional_docs loads: database-patterns, architecture-overview
   - Verify diagnosis created successfully

3. **Implementation Workflow**
   - User runs: `/implement 123` (GitHub issue for UI component)
   - Verify conditional_docs loads: shadcn-ui-components, react-query-patterns
   - Verify implementation completes successfully

4. **Chore Workflow**
   - User requests: "Update Docker configuration"
   - Run `/chore` command
   - Verify conditional_docs loads: docker-setup, docker-troubleshooting
   - Verify chore plan created successfully

5. **Bug Fix Workflow**
   - User runs: `/bug-plan 456` (GitHub issue for auth bug)
   - Verify conditional_docs loads: auth-troubleshooting, auth-security
   - Verify bug fix plan created successfully

### Edge Cases

1. **No Matches Scenario**
   - Task: "Update README.md"
   - Expected: Load default contexts only (architecture-overview)
   - Verify: Command proceeds successfully

2. **Multiple Category Matches**
   - Task: "Add authentication to API endpoint"
   - Expected: Load auth + server-actions + database (related contexts)
   - Verify: Limited to 5-7 files, prioritized correctly

3. **Ambiguous Keywords**
   - Task: "Fix the issue"
   - Expected: Load default contexts (architecture-overview)
   - Verify: Command proceeds, asks for clarification

4. **Missing Documentation File**
   - Profile references: "development/new-doc.md" (doesn't exist)
   - Expected: Skip missing file, log warning, continue with available docs
   - Verify: Command not blocked by missing file

5. **Circular Dependencies**
   - File A depends on B, B depends on A
   - Expected: Load both once, detect circular reference
   - Verify: No infinite loop, both loaded exactly once

6. **Very Long Task Description**
   - Task: 500+ word description with many keywords
   - Expected: Extract relevant keywords, don't overload with matches
   - Verify: Still limited to 5-7 files, most relevant selected

7. **Empty/Null Task Description**
   - Task: "" (empty string)
   - Expected: Load default contexts
   - Verify: Command proceeds successfully

8. **Special Characters in Task**
   - Task: "Fix bug with `user.email` validation"
   - Expected: Extract keywords correctly, ignore special chars
   - Verify: Routing works correctly

9. **Case Sensitivity**
   - Task: "DATABASE migration" vs "database MIGRATION"
   - Expected: Case-insensitive matching
   - Verify: Both load database-patterns.md

10. **Multiple Commands in Sequence**
    - Run `/feature` then `/implement` then `/diagnose` in same session
    - Expected: Each loads appropriate contexts independently
    - Verify: No cross-contamination, each routing correct

## Acceptance Criteria

1. **Command Profiles Created**
   - [ ] `.claude/config/command-profiles.yaml` exists with profiles for all 5 commands
   - [ ] Each profile has defaults, rules, and category mappings
   - [ ] All keyword triggers are documented with rationale

2. **Routing Engine Implemented**
   - [ ] `.claude/commands/conditional_docs.md` successfully routes tasks to documentation
   - [ ] Keyword matching works across all test cases
   - [ ] Dependency resolution auto-loads prerequisites
   - [ ] Results limited to 5-7 most relevant files
   - [ ] Graceful degradation if routing fails

3. **Command Integration Complete**
   - [ ] All 5 slash commands reference conditional_docs
   - [ ] Each command successfully loads appropriate documentation
   - [ ] No regressions in command functionality

4. **Performance Targets Met**
   - [ ] Routing execution time <500ms
   - [ ] Token usage reduced by 40-60% compared to loading all docs
   - [ ] Task success rate maintained at 100%

5. **Documentation Complete**
   - [ ] `.claude/config/README.md` documents schema and usage
   - [ ] `CLAUDE.md` section added explaining system
   - [ ] Usage examples created with 10+ test cases
   - [ ] All context-docs READMEs updated

6. **Testing Validated**
   - [ ] All 20+ integration tests pass
   - [ ] All 10+ edge cases handled correctly
   - [ ] Manual E2E validation for all 5 commands successful
   - [ ] Performance benchmarks documented

7. **Error Handling**
   - [ ] Missing profiles handled gracefully
   - [ ] Missing documentation files handled gracefully
   - [ ] Invalid YAML handled gracefully
   - [ ] Clear error messages for debugging

8. **Maintainability**
   - [ ] Schema well-documented for future updates
   - [ ] Adding new commands straightforward (<30 minutes)
   - [ ] Updating rules straightforward (edit YAML, no code changes)
   - [ ] Troubleshooting guide available

## Validation Commands
Execute every command to validate the feature works correctly with zero regressions.

```bash
# 1. Validate YAML syntax of command profiles
cat .claude/config/command-profiles.yaml | grep -E "^(profiles|  \w+:)"

# 2. Verify all expected directories exist
ls -la .claude/config/
ls -la .claude/bin/ || echo "Optional bin directory not created"

# 3. Check that conditional_docs.md was updated (not still template)
grep -q "app/server" .claude/commands/conditional_docs.md && echo "WARNING: Still has template content" || echo "PASS: Template content removed"

# 4. Verify all context documentation files still exist and accessible
find .ai/ai_docs/context-docs/ -name "*.md" -type f | wc -l  # Should be 29+

# 5. Test keyword matching - Run conditional_docs with sample task
# (Manual test: execute conditional_docs.md with implement command + sample task)

# 6. Test /implement integration - Run with sample GitHub issue
# /implement <test-issue-number>

# 7. Test /diagnose integration - Run with sample bug description
# /diagnose <test-issue-number>

# 8. Test /feature integration - Run with sample feature request
# /feature "Add dark mode toggle"

# 9. Test /chore integration - Run with sample maintenance task
# /chore "Update dependencies"

# 10. Test /bug-plan integration - Run with sample diagnosed bug
# /bug-plan <test-issue-number>

# 11. Validate documentation updates
grep -q "Conditional Documentation System" CLAUDE.md && echo "PASS: CLAUDE.md updated" || echo "FAIL: CLAUDE.md not updated"

# 12. Check for syntax errors in all modified files
pnpm lint:fix

# 13. Format all new/modified files
pnpm format:fix

# 14. Verify no broken references in documentation
# (Manual: check all file paths in command-profiles.yaml exist)

# 15. Performance benchmark - measure routing time
# (Manual: time the routing execution, should be <500ms)

# 16. Token usage comparison
# (Manual: compare token usage before/after for sample task)
```

## Notes

### Future Enhancements (Not in Scope)

1. **Machine Learning Optimization**
   - Track which documentation was actually useful for completed tasks
   - Learn patterns over time to improve routing accuracy
   - Suggest new rules based on usage patterns

2. **Visual Documentation Browser**
   - Web UI to browse command profiles
   - Interactive testing of routing rules
   - Visual dependency graph of documentation

3. **Auto-Generated Profiles**
   - Analyze command descriptions to auto-generate initial profiles
   - Suggest new rules based on command patterns

4. **Context Compression**
   - Summarize loaded documentation to reduce token usage further
   - Extract only relevant sections from loaded docs

5. **Multi-Command Awareness**
   - Remember documentation loaded in previous command in session
   - Avoid re-loading same docs across command chain

### Design Decisions

**Why YAML for profiles?**
- Human-readable and editable
- Native support in Claude Code commands
- Easy to version control
- Standard format for configuration

**Why centralized vs distributed?**
- Commands often need cross-cutting documentation (development + infrastructure + testing)
- Easier maintenance (one place to update)
- Single source of truth for routing logic
- Commands are consumers, not owners of routing rules

**Why limit to 5-7 files?**
- Balance between context and focus
- Typical token budget for documentation (35,000-50,000 tokens)
- Prevents context bloat while ensuring sufficient coverage
- Can be adjusted per command if needed

**Why not use AI for routing?**
- Routing logic should be deterministic and fast (<500ms)
- YAML rules are transparent and debuggable
- AI adds latency and complexity
- Simple keyword matching sufficient for initial implementation
- Can add AI enhancement in Phase 2 if needed

### Maintenance Guidelines

**How to add a new command profile:**
1. Add entry to `.claude/config/command-profiles.yaml`
2. Define defaults, rules, and categories
3. Test routing with sample tasks
4. Update command to reference conditional_docs
5. Document in `.claude/config/README.md`

**How to update routing rules:**
1. Edit `.claude/config/command-profiles.yaml`
2. Add/modify keyword triggers
3. Test with example tasks
4. Document rationale in comments

**How to add new context documentation:**
1. Create markdown file with YAML frontmatter
2. Add to appropriate subdirectory
3. Update subdirectory README.md
4. Update command-profiles.yaml if it should be loaded conditionally
5. Test routing to verify new doc is loaded when appropriate

**How to troubleshoot routing issues:**
1. Check `.claude/config/command-profiles.yaml` syntax
2. Verify file paths in profiles exist
3. Test keyword matching manually
4. Check task description for expected keywords
5. Review conditional_docs.md output for debugging info

### Related Documentation

- **CLAUDE.md** - Project conventions and patterns
- **`.ai/ai_docs/context-docs/README.md`** - Context documentation overview
- **`.claude/commands/implement.md`** - Implementation command that uses routing
- **`.claude/commands/diagnose.md`** - Diagnosis command that uses routing
- **`.claude/settings.json`** - Configuration and hooks infrastructure

### Success Metrics Tracking

Track these metrics before and after implementation:

**Token Efficiency:**
- Baseline: Average tokens loaded per command (estimate: 100,000-145,000)
- Target: Average tokens loaded per command (35,000-50,000)
- Goal: 40-60% reduction

**Task Success Rate:**
- Baseline: 100% (commands currently work with manual doc selection)
- Target: 100% (maintain success rate with optimized loading)

**Maintenance Time:**
- Baseline: Time to update routing rules (scattered across commands)
- Target: Time to update routing rules (centralized in one YAML file)
- Goal: 50% reduction

**Developer Satisfaction:**
- Survey: "Is the conditional documentation system helpful?"
- Survey: "Does it load the right documentation?"
- Survey: "Is it easy to maintain?"
