---
description: Intelligently route tasks to relevant context documentation using metadata-driven conditional loading
argument-hint: [command] [task-description]
model: haiku
allowed-tools: [Read, Grep, Glob, Bash(cat:*), Bash(grep:*)]
---

# Intelligent Conditional Documentation Router

This command implements a metadata-driven conditional documentation routing system that intelligently loads only the most relevant context files for each task. It uses command profiles, context metadata, and dynamic routing to reduce token usage by 60-75% while maintaining high task success rates.

## Architecture

**Three-Tier System:**

1. **Command Profiles** (`.claude/config/command-profiles.yaml`) - Define documentation needs per command
2. **Context Metadata** (YAML frontmatter in context files) - Tags, dependencies, cross-references
3. **Dynamic Router** (this file) - Smart matching engine

## Usage

This command is called automatically by slash commands to load optimal documentation:

```bash
# Called from /implement
/conditional_docs implement "Add OAuth2 social login"

# Called from /diagnose
/conditional_docs diagnose "Database query timeout on projects page"

# Called from /feature
/conditional_docs feature "Real-time collaboration with presence indicators"
```

## Instructions

You are the intelligent documentation routing engine. Your job is to analyze the task and return a prioritized list of 3-7 documentation files that are most relevant.

### Step 1: Parse Input

Extract the command name and task description from the input:
- **Command:** First argument (implement, diagnose, feature, chore, bug-plan)
- **Task:** Remaining text after command

### Step 2: Load Command Profile

Read `.claude/config/command-profiles.yaml` and extract the profile for the specified command.

The profile contains:
- `defaults`: Files always loaded
- `rules`: Conditional loading rules with keywords and priorities
- `categories`: Predefined sets for fallback
- `routing`: Global configuration

### Step 3: Extract Task Keywords

Analyze the task description and extract meaningful keywords:

**Include:**
- Technical terms (oauth, RLS, docker, supabase, react query)
- Action verbs (login, deploy, test, create, update)
- Domain concepts (auth, database, component, migration)
- Technology names (vercel, playwright, shadcn)

**Exclude:**
- Common words (the, a, an, and, or, with)
- Generic verbs (add, fix, make, do, get)
- Articles and prepositions

**Example:**
- Task: "Add OAuth2 social login with Google and GitHub"
- Keywords: `oauth2`, `social`, `login`, `google`, `github`, `auth`

### Step 4: Match Keywords to Rules

For each rule in the command profile:

1. Check if ANY keyword from the rule matches ANY keyword in the task (case-insensitive)
2. If match found:
   - Add files from the rule to candidate list
   - Assign score based on priority:
     - `high` = 3 points
     - `medium` = 2 points
     - `low` = 1 point
3. Bonus: Add +0.5 points for each additional keyword match

**Example Matching:**

```yaml
# Rule
- keywords: ["auth", "login", "oauth", "permission"]
  files:
    - "infrastructure/auth-overview.md"
  priority: high

# Task keywords: oauth2, social, login, auth
# Matches: login ✓, oauth ✓ (partial match), auth ✓
# Score: 3 (high) + 1.0 (2 additional matches) = 4.0 points
```

### Step 5: Load Defaults

Always include files from the `defaults` array with a score of 10 (ensures they appear first).

### Step 6: Resolve Dependencies (Optional)

If `routing.auto_resolve_dependencies: true`:

For each matched file:
1. Read the YAML frontmatter
2. Check for `dependencies` field
3. Recursively load each dependency file
4. Add to candidate list with score = 2.5 (between high and medium)
5. Stop at `max_dependency_depth` to prevent infinite loops

**Example:**

```yaml
---
id: "auth-overview"
dependencies: ["supabase-client", "server-actions", "team-accounts"]
---
```

Would attempt to load:
- `development/server-actions.md` (if exists)
- Other dependencies (skip if not found)

### Step 7: Follow Cross-References (Optional)

If `routing.follow_cross_references: true`:

For each matched file:
1. Read the YAML frontmatter
2. Check for `cross_references` field
3. Load files with type = `prerequisite` or `parent`
4. Add to candidate list with score = 2.0
5. Skip if already in candidate list

**Example:**

```yaml
---
cross_references:
  - id: "auth-implementation"
    type: "related"          # Skip - only load prerequisite/parent
  - id: "database-rls"
    type: "prerequisite"     # Load this!
---
```

### Step 8: Score and Rank

1. Combine all candidate files
2. Deduplicate (if same file appears multiple times, keep highest score)
3. Sort by score (highest first)
4. Take top N files where:
   - N >= `routing.min_files` (default: 3)
   - N <= `routing.max_files` (default: 7)

### Step 9: Return Results

Output the file paths in markdown format:

```markdown
## Recommended Documentation for [Command]

Based on task: "[Task Description]"

**Matched Keywords:** keyword1, keyword2, keyword3

**Files to Read (ordered by relevance):**

1. `.ai/ai_docs/context-docs/development/architecture-overview.md` (default)
2. `.ai/ai_docs/context-docs/infrastructure/auth-overview.md` (high priority: auth, login)
3. `.ai/ai_docs/context-docs/infrastructure/auth-implementation.md` (high priority: auth, oauth)
4. `.ai/ai_docs/context-docs/development/server-actions.md` (dependency from auth-overview)
5. `.ai/ai_docs/context-docs/infrastructure/auth-security.md` (high priority: auth)

**Total Files:** 5
**Estimated Token Savings:** ~60% compared to loading all documentation
```

## Error Handling

### Profile Not Found

If the command profile doesn't exist:

```markdown
⚠️ **Error:** Command profile for '[command]' not found in command-profiles.yaml

**Fallback:** Loading default documentation only:
- `.ai/ai_docs/context-docs/development/architecture-overview.md`

Please update `.claude/config/command-profiles.yaml` to add this command profile.
```

### No Keyword Matches

If no keywords match any rules:

```markdown
ℹ️ **Info:** No specific keyword matches found for this task.

**Loading defaults only:**
- `.ai/ai_docs/context-docs/development/architecture-overview.md`

This may indicate:
1. Task is very generic (no specific domain)
2. Keywords in command profile need updating
3. This is an unusual task type

Proceeding with minimal context. You may manually load additional documentation if needed.
```

### Missing Files

If a matched file doesn't exist:

```markdown
⚠️ **Warning:** Expected file not found: `infrastructure/missing-file.md`

Skipping this file and continuing with other matches.
```

### YAML Parse Error

If command-profiles.yaml has syntax errors:

```markdown
❌ **Error:** Failed to parse command-profiles.yaml

YAML syntax error: [error message]

**Fallback:** Cannot route documentation. Please fix the YAML syntax and try again.

For now, manually read relevant documentation from `.ai/ai_docs/context-docs/`
```

## Implementation Algorithm

Here's the pseudocode for the routing logic:

```python
def route_documentation(command: str, task_description: str) -> List[str]:
    # Step 1: Load command profile
    profile = load_yaml('.claude/config/command-profiles.yaml')
    command_profile = profile['profiles'][command]
    routing_config = profile['routing']

    # Step 2: Extract task keywords
    task_keywords = extract_keywords(task_description)

    # Step 3: Initialize candidates
    candidates = {}  # file_path -> score

    # Step 4: Load defaults with highest score
    for file in command_profile['defaults']:
        candidates[file] = 10.0

    # Step 5: Match rules
    for rule in command_profile['rules']:
        matched_keywords = set(task_keywords) & set(rule['keywords'])
        if matched_keywords:
            base_score = routing_config['priority_weights'][rule['priority']]
            bonus_score = (len(matched_keywords) - 1) * 0.5
            score = base_score + bonus_score

            for file in rule['files']:
                if file not in candidates or score > candidates[file]:
                    candidates[file] = score

    # Step 6: Resolve dependencies
    if routing_config['auto_resolve_dependencies']:
        for file in list(candidates.keys()):
            dependencies = get_dependencies(file, max_depth=routing_config['max_dependency_depth'])
            for dep_file in dependencies:
                if dep_file not in candidates:
                    candidates[dep_file] = 2.5

    # Step 7: Follow cross-references
    if routing_config['follow_cross_references']:
        for file in list(candidates.keys()):
            cross_refs = get_cross_references(file, types=['prerequisite', 'parent'])
            for ref_file in cross_refs:
                if ref_file not in candidates:
                    candidates[ref_file] = 2.0

    # Step 8: Sort and limit
    sorted_files = sorted(candidates.items(), key=lambda x: x[1], reverse=True)
    min_files = routing_config['min_files']
    max_files = routing_config['max_files']

    # Take between min and max files
    result_files = sorted_files[:max_files]
    if len(result_files) < min_files:
        # Not enough matches, add from categories (future enhancement)
        pass

    return [f[0] for f in result_files]

def extract_keywords(text: str) -> List[str]:
    # Convert to lowercase
    text = text.lower()

    # Remove common words
    stopwords = ['the', 'a', 'an', 'and', 'or', 'with', 'for', 'to', 'in', 'on', 'at']
    words = text.split()
    keywords = [w for w in words if w not in stopwords]

    # Extract technical terms and compound phrases
    # oauth2, react query, server action, etc.

    return keywords

def get_dependencies(file_path: str, max_depth: int = 2, current_depth: int = 0) -> List[str]:
    if current_depth >= max_depth:
        return []

    # Read YAML frontmatter
    frontmatter = read_frontmatter(file_path)
    dependencies = frontmatter.get('dependencies', [])

    result = []
    for dep_id in dependencies:
        dep_file = find_file_by_id(dep_id)
        if dep_file:
            result.append(dep_file)
            # Recursive resolution
            nested_deps = get_dependencies(dep_file, max_depth, current_depth + 1)
            result.extend(nested_deps)

    return result

def get_cross_references(file_path: str, types: List[str]) -> List[str]:
    frontmatter = read_frontmatter(file_path)
    cross_refs = frontmatter.get('cross_references', [])

    result = []
    for ref in cross_refs:
        if ref.get('type') in types:
            ref_file = find_file_by_id(ref['id'])
            if ref_file:
                result.append(ref_file)

    return result
```

## Practical Implementation Notes

Since this is a markdown command (not actual code), you should:

1. **Read the YAML file** using the Read tool:
   ```
   Read: /home/msmith/projects/2025slideheroes/.claude/config/command-profiles.yaml
   ```

2. **Parse the profile** for the specified command manually (extract the relevant section)

3. **Extract keywords** from the task description (manual text analysis)

4. **Match keywords** against rules (manual comparison)

5. **Score matches** using the priority weights

6. **Read frontmatter** of matched files to check dependencies:
   ```
   Read: /home/msmith/projects/2025slideheroes/.ai/ai_docs/context-docs/[file]
   ```
   Extract the `dependencies` and `cross_references` fields from the YAML frontmatter.

7. **Build the final list** and output in the format shown above

## Performance Targets

- **Execution time:** <500ms (including file reads)
- **Files returned:** 3-7 files (sweet spot: 5)
- **Token reduction:** 60-75% compared to loading all documentation
- **Success rate:** 100% (all tasks complete successfully)

## Testing

Test the router with these example tasks:

### Test 1: Authentication Implementation
```
Command: implement
Task: "Add OAuth2 social login with Google and GitHub"
Expected: architecture-overview, auth-overview, auth-implementation, auth-security, server-actions
```

### Test 2: Database Diagnosis
```
Command: diagnose
Task: "Database query timeout on projects page"
Expected: architecture-overview, database-patterns, performance-testing
```

### Test 3: UI Feature
```
Command: feature
Task: "Add dark mode toggle to application settings"
Expected: architecture-overview, prime-framework, shadcn-ui-components, react-query-patterns
```

### Test 4: Infrastructure Chore
```
Command: chore
Task: "Update Docker configuration for local development"
Expected: architecture-overview, docker-setup, docker-troubleshooting
```

### Test 5: Bug Fix Planning
```
Command: bug-plan
Task: "Fix unauthorized access error in team settings"
Expected: architecture-overview, auth-overview, auth-troubleshooting, auth-security
```

## Debugging

If routing seems incorrect:

1. **Check keywords:** Print extracted keywords and verify they make sense
2. **Check matches:** Print which rules matched and their scores
3. **Check files:** Verify file paths are correct and files exist
4. **Check frontmatter:** Verify YAML frontmatter is correctly formatted
5. **Check config:** Verify command-profiles.yaml has correct syntax

## Future Enhancements

Potential improvements:

1. **Semantic matching:** Use embeddings for better keyword matching
2. **Learning system:** Track which docs were helpful, adjust scores
3. **Caching:** Cache parsed YAML and frontmatter for faster routing
4. **Validation:** Pre-validate all file paths in profiles
5. **Analytics:** Track routing decisions and performance metrics
6. **A/B testing:** Compare different routing strategies
7. **Auto-tuning:** Automatically adjust keywords based on usage patterns

## Related Documentation

- **Command Profiles:** `.claude/config/README.md`
- **Context Documentation:** `.ai/ai_docs/context-docs/README.md`
- **Project Guide:** `CLAUDE.md` (Conditional Documentation System section)
