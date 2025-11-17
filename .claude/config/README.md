# Command Profiles Configuration

This directory contains configuration files for the intelligent conditional documentation system that routes slash commands to relevant context documentation.

## Overview

The conditional documentation system uses a three-tier architecture:

1. **Command Profiles** (`command-profiles.yaml`) - Define documentation needs for each slash command
2. **Context Metadata** (YAML frontmatter in `.ai/ai_docs/context-docs/`) - Existing metadata on documentation files
3. **Dynamic Router** (`.claude/commands/conditional_docs.md`) - Smart routing engine that matches tasks to documentation

## File Structure

```
.claude/config/
├── README.md                    # This file - documentation
├── command-profiles.yaml        # Main configuration file
└── (future config files)
```

## command-profiles.yaml Schema

### Profile Structure

Each command profile follows this structure:

```yaml
profiles:
  command_name:
    description: "Brief description of the command's purpose"

    defaults:
      - "path/to/always-loaded-file.md"

    rules:
      - keywords: ["keyword1", "keyword2"]
        files:
          - "path/to/conditional-file.md"
        priority: high|medium|low

    categories:
      category_name:
        - "path/to/category-file.md"
```

### Field Definitions

#### `description` (string, required)
Brief description of what the command does. Used for documentation and debugging.

**Example:**
```yaml
description: "Execute implementation plans from GitHub issues"
```

#### `defaults` (array of strings, required)
Files that are ALWAYS loaded regardless of task keywords. These provide essential baseline context.

**Guidelines:**
- Keep to 1-2 files maximum (typically `architecture-overview.md`)
- Choose foundational documents that apply to all tasks for this command
- Files must exist in `.ai/ai_docs/context-docs/`

**Example:**
```yaml
defaults:
  - "development/architecture-overview.md"
  - "development/prime-framework.md"
```

#### `rules` (array of objects, required)
Conditional loading rules that match task keywords to documentation files.

**Rule Object Schema:**
```yaml
- keywords: ["keyword1", "keyword2"]  # Array of strings (lowercase)
  files: ["file1.md", "file2.md"]      # Array of file paths
  priority: high|medium|low             # Priority level
```

**Fields:**
- `keywords` (array of strings, required) - Keywords to match in task description (case-insensitive)
- `files` (array of strings, required) - Files to load when keywords match
- `priority` (string, required) - Priority weight: `high`, `medium`, or `low`

**Priority Guidelines:**
- `high` - Critical documentation needed for this type of task (weight: 3)
- `medium` - Helpful but not essential (weight: 2)
- `low` - Nice-to-have context (weight: 1)

**Example:**
```yaml
rules:
  # High priority: authentication tasks need auth docs
  - keywords: ["auth", "login", "signup", "permission"]
    files:
      - "infrastructure/auth-overview.md"
      - "infrastructure/auth-implementation.md"
    priority: high

  # Medium priority: UI tasks may need component docs
  - keywords: ["component", "ui", "form", "button"]
    files:
      - "development/shadcn-ui-components.md"
    priority: medium

  # Low priority: deployment context for all tasks
  - keywords: ["deploy", "deployment", "vercel"]
    files:
      - "infrastructure/vercel-deployment.md"
    priority: low
```

#### `categories` (object, optional)
Predefined sets of documentation for broad topic areas. Used for fallback or category-based loading.

**Example:**
```yaml
categories:
  frontend:
    - "development/shadcn-ui-components.md"
    - "development/react-query-patterns.md"
  backend:
    - "development/server-actions.md"
    - "development/database-patterns.md"
```

### Routing Configuration

The `routing` section defines global behavior for the documentation router:

```yaml
routing:
  max_files: 7                        # Maximum docs to return
  min_files: 3                        # Minimum docs to return
  priority_weights:
    high: 3
    medium: 2
    low: 1
  auto_resolve_dependencies: true     # Load dependencies from YAML frontmatter
  follow_cross_references: true       # Follow cross-refs in frontmatter
  max_dependency_depth: 2             # Max depth for dependency chains
```

## How the Router Works

### 1. Task Analysis
The router extracts keywords from the task description:
- Converts to lowercase
- Removes common words (the, a, an, etc.)
- Extracts nouns, verbs, technical terms

### 2. Keyword Matching
For each rule in the command profile:
- Check if ANY keyword from the rule matches ANY keyword in the task
- If match found, add files to candidate list with priority score

### 3. Scoring & Ranking
Each matched file receives a score:
- Base score = priority weight (high=3, medium=2, low=1)
- Bonus points for multiple keyword matches
- Files are ranked by total score

### 4. Dependency Resolution
If `auto_resolve_dependencies: true`:
- Read YAML frontmatter of matched files
- Check `dependencies` field
- Recursively load dependency files (up to `max_dependency_depth`)

### 5. Cross-Reference Following
If `follow_cross_references: true`:
- Read `cross_references` field from frontmatter
- Load `prerequisite` and `parent` type references
- Add to results if not already included

### 6. Result Limiting
- Sort files by score (highest first)
- Take top N files (between `min_files` and `max_files`)
- Return file paths

## Usage Examples

### Example 1: Implementation Task

**Task:** "Implement OAuth2 social login with Google and GitHub"

**Command:** `/implement`

**Routing Process:**
1. Extract keywords: `oauth2`, `social`, `login`, `google`, `github`
2. Match against `/implement` rules:
   - `auth`, `login`, `oauth` → Match! Load `auth-overview.md`, `auth-implementation.md`, `auth-security.md` (priority: high)
3. Load defaults: `architecture-overview.md`
4. Resolve dependencies from `auth-overview.md`:
   - `server-actions` → Load `server-actions.md`
5. Total files: 5 (within limits)

**Result:**
```
- development/architecture-overview.md (default)
- infrastructure/auth-overview.md (high priority match)
- infrastructure/auth-implementation.md (high priority match)
- infrastructure/auth-security.md (high priority match)
- development/server-actions.md (dependency)
```

### Example 2: Diagnosis Task

**Task:** "Database query timeout on projects page"

**Command:** `/diagnose`

**Routing Process:**
1. Extract keywords: `database`, `query`, `timeout`, `projects`, `page`
2. Match against `/diagnose` rules:
   - `database`, `query`, `timeout` → Match! Load `database-patterns.md` (priority: high)
   - `timeout` → Match! Load `performance-testing.md` (priority: medium)
3. Load defaults: `architecture-overview.md`
4. Total files: 3 (minimum met)

**Result:**
```
- development/architecture-overview.md (default)
- development/database-patterns.md (high priority match)
- testing+quality/performance-testing.md (medium priority match)
```

### Example 3: Feature Planning

**Task:** "Add real-time collaboration features with presence indicators"

**Command:** `/feature`

**Routing Process:**
1. Extract keywords: `realtime`, `collaboration`, `presence`, `indicators`
2. Match against `/feature` rules:
   - `realtime` → Match! Load `react-query-advanced.md` (priority: medium)
   - `indicators` (UI element) → Match! Load `shadcn-ui-components.md` (priority: high)
3. Load defaults: `architecture-overview.md`, `prime-framework.md`
4. Resolve dependencies from `react-query-advanced.md`:
   - `react-query-patterns` → Load `react-query-patterns.md`
5. Total files: 5 (within limits)

**Result:**
```
- development/architecture-overview.md (default)
- development/prime-framework.md (default)
- development/shadcn-ui-components.md (high priority match)
- development/react-query-advanced.md (medium priority match)
- development/react-query-patterns.md (dependency)
```

## Adding a New Command Profile

To add a new command profile:

1. **Identify the command's documentation needs:**
   - What type of work does this command do?
   - What documentation is ALWAYS needed? (defaults)
   - What documentation is SOMETIMES needed? (rules)

2. **Add profile to `command-profiles.yaml`:**
   ```yaml
   profiles:
     my_new_command:
       description: "Description of the command"
       defaults:
         - "essential-doc.md"
       rules:
         - keywords: ["keyword1", "keyword2"]
           files:
             - "conditional-doc.md"
           priority: high
       categories:
         category_name:
           - "category-doc.md"
   ```

3. **Test the profile:**
   - Run the command with sample tasks
   - Verify correct documentation is loaded
   - Adjust keywords/priorities as needed

4. **Update `.claude/commands/my_new_command.md`:**
   Add instruction to load conditional docs at the beginning of the command.

## Updating an Existing Profile

To modify an existing command profile:

1. **Identify what needs to change:**
   - Missing documentation for certain task types?
   - Too many/too few files being loaded?
   - Wrong priority levels?

2. **Edit `command-profiles.yaml`:**
   - Add/remove keywords
   - Add/remove files
   - Adjust priorities
   - Update defaults if needed

3. **Test changes:**
   - Run command with various task types
   - Verify improvements
   - Monitor token usage

4. **Document changes:**
   - Update this README if schema changes
   - Add examples if adding complex rules

## Maintenance Guidelines

### Keyword Selection Best Practices

**Good keywords:**
- Specific technical terms: `oauth`, `RLS`, `docker`
- Action verbs: `login`, `deploy`, `test`
- Domain concepts: `auth`, `database`, `component`
- Technology names: `supabase`, `vercel`, `playwright`

**Avoid:**
- Generic words: `add`, `fix`, `update` (too broad)
- Common words: `the`, `and`, `with`
- Overly specific: `google-oauth-button` (too narrow)

**Use variations:**
```yaml
keywords: ["auth", "authentication", "login", "signin", "sign-in"]
```

### Priority Assignment Guidelines

**High Priority:**
- Documentation is essential to complete the task
- Task will fail or be incorrect without this context
- Primary domain knowledge for this task type

**Medium Priority:**
- Documentation is helpful but not critical
- Provides valuable context and best practices
- Common patterns for this type of task

**Low Priority:**
- Documentation provides nice-to-have context
- Background information
- Related but not directly applicable

### File Path Best Practices

**Always use relative paths from `.ai/ai_docs/context-docs/`:**
```yaml
# ✅ Correct
files:
  - "development/architecture-overview.md"
  - "infrastructure/auth-overview.md"

# ❌ Wrong
files:
  - "/home/user/project/.ai/ai_docs/context-docs/development/architecture-overview.md"
  - "architecture-overview.md"  # Missing subdirectory
```

### Testing Profiles

After making changes, test with representative tasks:

```bash
# Example: Test /implement profile
# Create test tasks that cover different scenarios

# Test 1: Auth task
Task: "Add OAuth2 login with Google"
Expected: auth-overview, auth-implementation, auth-security, server-actions

# Test 2: Database task
Task: "Create RLS policies for projects table"
Expected: architecture-overview, database-patterns

# Test 3: UI task
Task: "Add dark mode toggle component"
Expected: architecture-overview, shadcn-ui-components

# Test 4: Full-stack task
Task: "Build user profile editing with avatar upload"
Expected: architecture-overview, server-actions, shadcn-ui-components, database-patterns
```

## Troubleshooting

### No files loaded
**Symptom:** Router returns only defaults or empty result

**Possible causes:**
- Keywords don't match any rules
- File paths are incorrect
- YAML syntax error

**Solution:**
1. Check keyword spelling and variations
2. Verify file paths exist in `.ai/ai_docs/context-docs/`
3. Validate YAML syntax: `yamllint command-profiles.yaml`

### Too many files loaded
**Symptom:** Router returns 10+ files, consuming too many tokens

**Possible causes:**
- Keywords are too broad
- Too many high-priority rules matching
- `max_files` set too high

**Solution:**
1. Make keywords more specific
2. Adjust priorities (downgrade some to medium/low)
3. Reduce `max_files` in routing config
4. Review defaults (should be 1-2 files max)

### Wrong files loaded
**Symptom:** Router loads irrelevant documentation

**Possible causes:**
- Keywords match unintended rules
- Priorities are incorrect
- Dependencies pulling in unrelated files

**Solution:**
1. Review keyword list for overly broad terms
2. Adjust priorities to favor correct rules
3. Check `auto_resolve_dependencies` setting
4. Review YAML frontmatter dependencies

### Circular dependencies
**Symptom:** Same files loaded multiple times or infinite loop

**Possible causes:**
- File A depends on B, B depends on A
- Dependency chain exceeds `max_dependency_depth`

**Solution:**
1. Set `max_dependency_depth: 2` (or lower)
2. Review YAML frontmatter to remove circular refs
3. Deduplication should happen automatically (check router logic)

## Performance Optimization

### Token Efficiency Targets

- **Before conditional docs:** 100,000-150,000 tokens (loading all 29 files)
- **After conditional docs:** 30,000-50,000 tokens (loading 3-7 files)
- **Target reduction:** 60-75%

### Monitoring Performance

Track these metrics:
1. **Number of files loaded** - Should be 3-7 per command
2. **Token count** - Measure before/after for sample tasks
3. **Routing execution time** - Should be <500ms
4. **Task success rate** - Should maintain 100%

### Optimization Strategies

If performance is poor:

1. **Reduce defaults** - Keep to 1-2 essential files
2. **Increase priority thresholds** - Only load high-priority matches
3. **Disable auto-features** - Set `auto_resolve_dependencies: false`
4. **Reduce max_files** - Lower from 7 to 5
5. **Cache compiled profiles** - Future enhancement

## Version History

- **1.0.0** (2025-11-17) - Initial implementation
  - Profiles for 5 commands: implement, diagnose, feature, chore, bug-plan
  - Keyword-based routing with priority scoring
  - Automatic dependency resolution
  - Cross-reference following

## Future Enhancements

Potential improvements for future versions:

1. **Semantic matching** - Use embeddings for better keyword matching
2. **Learning system** - Track which docs were actually helpful
3. **Profile validation** - CLI tool to validate YAML schema
4. **Performance dashboard** - Track routing metrics over time
5. **A/B testing** - Compare different routing strategies
6. **Profile templates** - Starter templates for new commands
7. **Auto-generated profiles** - Analyze command usage to suggest profiles

## Related Documentation

- **Conditional Documentation Router:** `.claude/commands/conditional_docs.md`
- **Context Documentation:** `.ai/ai_docs/context-docs/README.md`
- **PRIME Framework:** `.ai/ai_docs/context-docs/development/prime-framework.md`
- **Project Documentation:** `CLAUDE.md` (Conditional Documentation System section)

## Support

For questions or issues with command profiles:

1. Check troubleshooting section above
2. Review usage examples
3. Validate YAML syntax
4. Test with simple tasks first
5. Update this README with new learnings
