---
description: Update Payload CMS to latest version with automated dependency management, version alignment, and comprehensive validation
category: maintenance
allowed-tools: Bash, Read, Edit, MultiEdit, Write, Glob, Task, TodoWrite
argument-hint: <version> (optional, defaults to latest)
mcp-tools: mcp__docs-mcp__search_docs
---

# Update Payload Command

Systematically update Payload CMS and all related packages using PRIME framework to maintain version alignment and project stability with intelligent error recovery and parallel validation.

## Key Features
- **Version Alignment**: Ensures all @payloadcms/* packages use consistent versions
- **Automated Validation**: Parallel build, type, and lint checking with recovery
- **Smart Detection**: Identifies breaking changes and prompts for confirmation
- **Type Generation**: Automatic payload-types.ts regeneration with timeout handling
- **Progress Tracking**: Real-time visibility with TodoWrite integration
- **Rollback Safety**: Creates restoration points before critical changes

## Essential Context
<!-- Always read for this command -->
- Read .claude/context/development/standards/code-standards.md
- Read CLAUDE.md

## Prompt

<role>
You are the Senior Payload CMS Engineer, specializing in Payload ecosystem management, monorepo dependency resolution, and semantic versioning. You have deep expertise in pnpm workspaces, TypeScript configuration, and Next.js integration patterns. Your authority includes autonomous version selection, dependency alignment decisions, and build optimization strategies. You approach updates pragmatically, prioritizing stability while embracing beneficial improvements.
</role>

<instructions>
# Payload CMS Update Workflow - PRIME Framework

**CORE REQUIREMENTS**:
- **Follow** PRIME framework: Purpose → Role → Inputs → Method → Expectations
- **Maintain** version consistency across ALL @payloadcms/* packages
- **Never** use sed for JSON manipulation - use MultiEdit tool
- **Track** progress with TodoWrite for multi-step visibility
- **Validate** at each critical phase with parallel execution
- **Document** any breaking changes or manual steps required

## PRIME Workflow

### Phase P - PURPOSE
<purpose>
**Define** clear outcomes and success criteria:

1. **Primary Objective**: Update Payload CMS and all @payloadcms/* packages to a consistent target version while maintaining project stability and functionality

2. **Success Criteria**:
   - ✅ All Payload packages at same version
   - ✅ Zero version mismatches across monorepo
   - ✅ Project builds without errors
   - ✅ TypeScript compilation successful
   - ✅ Types regenerated successfully
   - ✅ No new linting violations
   - ✅ Health check route updated
   - ✅ Admin UI accessible post-update

3. **Scope Boundaries**:
   **Included:**
   - Payload core (@payloadcms/payload)
   - All @payloadcms/* plugin packages
   - Package version fields in package.json files
   - Health check route version string
   - Type regeneration
   - Dependency resolution

   **Excluded:**
   - Database migrations (manual if needed)
   - Non-Payload package updates
   - Pre-existing code issues
   - Custom business logic modifications

4. **Constraints**:
   - Never modify environment files
   - Preserve all custom configurations
   - Maintain backward compatibility when possible
   - Complete within 5-minute window
</purpose>

### Phase R - ROLE
<role_definition>
**Already established in role section above.**

Additional authority levels:
- **Full control** over package.json modifications
- **Decision authority** for version selection and alignment
- **Advisory role** for breaking changes requiring migrations
- **Escalation power** when manual intervention needed
</role_definition>

### Phase I - INPUTS
<inputs>
**Gather** all necessary materials before execution:

#### Essential Context Loading
**Read** project-critical files immediately:
```bash
# These files are already loaded via Essential Context section
# Additional runtime checks will be performed
```

#### Dynamic Context Discovery
**Delegate** to context-discovery-expert for intelligent context selection:

```
Use Task tool with:
- subagent_type: "context-discovery-expert"
- description: "Discover context for Payload CMS update"
- prompt: "Find relevant context for updating Payload CMS in a pnpm monorepo.
          Command type: maintenance/update
          Token budget: 3000
          Focus on: Payload configuration, dependency management, monorepo patterns,
                   TypeScript setup, Next.js integration, migration guides
          Priority: Version compatibility, breaking changes, type generation"
```

#### User Parameters
**Parse** command arguments:
```bash
# Extract target version from arguments
TARGET_VERSION="${1:-latest}"
VERBOSE_MODE="${2:---standard}"

# Validate version format
if [[ "$TARGET_VERSION" != "latest" && ! "$TARGET_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "⚠️ Invalid version format. Use 'latest' or semantic version (e.g., 3.41.0)"
  exit 1
fi
```

#### Pre-flight Checks
**Verify** system state:
```bash
# Check for uncommitted changes
GIT_STATUS=$(git status --porcelain)
if [ ! -z "$GIT_STATUS" ]; then
  echo "⚠️ Uncommitted changes detected. Continue anyway? (y/n)"
  # Read user confirmation
fi
```
</inputs>

### Phase M - METHOD
<method>
**Execute** the main update workflow with progress tracking:

#### Step 1: Initialize Progress Tracking
**Set up** TodoWrite for visibility:
```javascript
todos = [
  {content: "Validate current state", status: "pending", activeForm: "Validating current state"},
  {content: "Discover latest version", status: "pending", activeForm: "Discovering latest version"},
  {content: "Analyze version jump", status: "pending", activeForm: "Analyzing version jump"},
  {content: "Map package locations", status: "pending", activeForm: "Mapping package locations"},
  {content: "Update package files", status: "pending", activeForm: "Updating package files"},
  {content: "Update health check", status: "pending", activeForm: "Updating health check"},
  {content: "Install dependencies", status: "pending", activeForm: "Installing dependencies"},
  {content: "Generate types", status: "pending", activeForm: "Generating types"},
  {content: "Validate build", status: "pending", activeForm: "Validating build"},
  {content: "Run quality checks", status: "pending", activeForm: "Running quality checks"},
  {content: "Generate report", status: "pending", activeForm: "Generating report"}
]
```

#### Step 2: Validation & Discovery (Parallel)
**Execute** parallel discovery operations:

Mark first two todos as in_progress, then:

```bash
# Parallel execution of independent checks
parallel_commands=(
  "rg '\"payload\":\\s*\"[^\"]*\"' apps/payload/package.json"
  "curl -s https://registry.npmjs.org/payload/latest | jq -r '.version'"
  "rg '@payloadcms/[^\"]*' -g 'package.json' --no-heading"
)

# Execute in parallel and collect results
```

**Analyze** version jump intelligently:
```bash
CURRENT_VERSION=$(extracted from step above)
LATEST_VERSION=$(extracted from step above)

# Determine update type
IFS='.' read -ra CURRENT_PARTS <<< "$CURRENT_VERSION"
IFS='.' read -ra LATEST_PARTS <<< "$LATEST_VERSION"

if [[ "${CURRENT_PARTS[0]}" != "${LATEST_PARTS[0]}" ]]; then
  UPDATE_TYPE="MAJOR"
  echo "⚠️ Major version update detected!"

  # User clarification for breaking changes
  echo "This is a major version update from $CURRENT_VERSION to $LATEST_VERSION"
  echo "Would you like to:"
  echo "1. Review changelog first (recommended)"
  echo "2. Proceed with update"
  echo "3. Cancel operation"
  # Handle user response
elif [[ "${CURRENT_PARTS[1]}" != "${LATEST_PARTS[1]}" ]]; then
  UPDATE_TYPE="MINOR"
else
  UPDATE_TYPE="PATCH"
fi
```

Mark validation todos as completed.

#### Step 3: Package Updates with MultiEdit
**Update** all package.json files systematically:

Mark "Update package files" todo as in_progress.

**For apps/payload/package.json:**
```javascript
// Use MultiEdit tool with multiple edits
edits = [
  {
    old_string: '"version": "current_version"',
    new_string: '"version": "new_version"'
  },
  {
    old_string: '"payload": "^current_payload_version"',
    new_string: '"payload": "^new_payload_version"'
  },
  // Add edit for each @payloadcms/* package found
]
```

**Apply** similar updates to:
- packages/cms/payload/package.json (exact version, no caret)
- apps/web/package.json (for @payloadcms/db-postgres)

Mark todo as completed.

#### Step 4: Health Check Update
**Locate** and **update** health check route:

Mark "Update health check" todo as in_progress.

```bash
# Find health check file
HEALTH_FILE="apps/payload/src/app/(payload)/api/health/route.ts"

# Update version string using Edit tool
```

Mark todo as completed.

#### Step 5: Dependency Installation with Recovery
**Clean** and **reinstall** dependencies:

Mark "Install dependencies" todo as in_progress.

```bash
# Remove lock for fresh resolution
rm -f pnpm-lock.yaml

# Install with automatic retry on failure
attempt=0
max_attempts=3
while [ $attempt -lt $max_attempts ]; do
  pnpm install && break
  attempt=$((attempt + 1))
  echo "Retry $attempt of $max_attempts..."
  sleep 2
done
```

Mark todo as completed.

#### Step 6: Type Generation with Timeout Handling
**Generate** Payload types intelligently:

Mark "Generate types" todo as in_progress.

```bash
# Run generation with timeout handling
timeout 30 pnpm --filter payload generate:types &
GENERATE_PID=$!

# Monitor for completion
sleep 5
if ps -p $GENERATE_PID > /dev/null; then
  echo "Type generation in progress (this may appear to hang)..."
  wait $GENERATE_PID
fi

# Verify by checking file timestamp
if [ -f "apps/payload/payload-types.ts" ]; then
  TIMESTAMP=$(stat -c %Y "apps/payload/payload-types.ts" 2>/dev/null || stat -f %m "apps/payload/payload-types.ts")
  CURRENT_TIME=$(date +%s)
  AGE=$((CURRENT_TIME - TIMESTAMP))

  if [ $AGE -lt 60 ]; then
    echo "✅ Types regenerated successfully"
  else
    echo "⚠️ Type file exists but may be stale"
  fi
fi
```

Mark todo as completed.

#### Step 7: Parallel Validation Suite
**Execute** validation checks in parallel:

Mark "Validate build" and "Run quality checks" todos as in_progress.

```bash
# Parallel validation execution
(
  # Stream 1: Build validation
  pnpm --filter payload build 2>&1 | tee /tmp/payload-build.log
  echo $? > /tmp/build-exit-code
) &

(
  # Stream 2: Type checking
  pnpm --filter payload typecheck 2>&1 | tee /tmp/payload-typecheck.log
  echo $? > /tmp/typecheck-exit-code
) &

(
  # Stream 3: Linting
  pnpm biome check apps/payload --diagnostic-level=error 2>&1 | tee /tmp/payload-lint.log
  echo $? > /tmp/lint-exit-code
) &

# Wait for all validation streams
wait

# Collect results
BUILD_EXIT=$(cat /tmp/build-exit-code)
TYPECHECK_EXIT=$(cat /tmp/typecheck-exit-code)
LINT_EXIT=$(cat /tmp/lint-exit-code)
```

Mark validation todos as completed.

#### Decision Tree: Handle Validation Failures
```
IF build failed:
  → **Clear** .next cache: rm -rf apps/payload/.next
  → **Retry** build once
  → THEN **Document** persistent failures
ELSE IF type errors found:
  → **Distinguish** new vs pre-existing errors
  → **Log** new errors for review
  → THEN **Continue** if only pre-existing
ELSE IF lint errors found:
  → **Check** if errors are in Payload code
  → **Document** for manual fix
  → THEN **Proceed** with warnings
ELSE:
  → **Mark** all validation successful
  → THEN **Generate** success report
```

#### Step 8: Optional Agent Delegation
**Delegate** complex issues to specialists when needed:

```
IF complex TypeScript errors:
  Use Task tool with:
  - subagent_type: "typescript-expert"
  - description: "Resolve Payload update TypeScript errors"
  - prompt: "After updating Payload CMS from $CURRENT_VERSION to $LATEST_VERSION,
           we have TypeScript errors: [include errors].
           Suggest fixes that maintain Payload compatibility."

IF dependency conflicts:
  Use Task tool with:
  - subagent_type: "nodejs-expert"
  - description: "Resolve pnpm dependency conflicts"
  - prompt: "Payload update causing dependency conflicts in pnpm workspace.
           Current errors: [include errors]. Suggest resolution strategy."
```
</method>

### Phase E - EXPECTATIONS
<expectations>
**Validate** and **Deliver** comprehensive results:

Mark "Generate report" todo as in_progress.

#### Output Specification
**Generate** detailed update report:

```markdown
📦 Payload CMS Update Report
============================
Previous Version: [version]
New Version: [version]
Update Type: [MAJOR|MINOR|PATCH]
Duration: [time]

✅ Packages Updated: [count]
├─ apps/payload: ✓
├─ packages/cms/payload: ✓
└─ apps/web: ✓

✅ Validation Results:
├─ Build: [Success|Failed]
├─ Types: [Regenerated|Stale]
├─ TypeScript: [Clean|Errors]
└─ Linting: [Clean|Warnings]

📊 Metrics:
├─ Files Modified: [count]
├─ Dependencies Updated: [count]
├─ Type Generation Time: [seconds]
└─ Total Duration: [minutes]

⚠️ Action Items:
[List any manual steps required]

Next Steps:
1. Test admin UI at http://localhost:3000/admin
2. Verify API endpoints functionality
3. Check custom collections/fields
4. Review breaking changes if major update
5. Commit changes if satisfied

Rollback Command (if needed):
git checkout -- . && rm -rf node_modules pnpm-lock.yaml && pnpm install
```

#### Validation Checks
**Verify** critical success indicators:
```bash
# Final validation sweep
VALIDATION_PASSED=true

# Check version alignment
MISMATCHED=$(rg '@payloadcms/[^"]*":\s*"[^"]*"' -g 'package.json' | awk -F'"' '{print $4}' | sort -u | wc -l)
if [ $MISMATCHED -gt 1 ]; then
  VALIDATION_PASSED=false
  echo "❌ Version mismatch detected across packages"
fi

# Verify critical files exist
CRITICAL_FILES=(
  "apps/payload/payload-types.ts"
  "apps/payload/payload.config.ts"
  "pnpm-lock.yaml"
)

for file in "${CRITICAL_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    VALIDATION_PASSED=false
    echo "❌ Missing critical file: $file"
  fi
done
```

#### Error Recovery Instructions
**Provide** clear recovery paths:

```
Common Issues & Solutions:
========================
1. Type generation timeout
   → Check file timestamp, usually completes despite timeout

2. Build memory errors
   → NODE_OPTIONS="--max-old-space-size=8192" pnpm build

3. Module not found errors
   → rm -rf node_modules && pnpm install

4. Persistent TypeScript errors
   → May be pre-existing, check git diff

5. Database migration required
   → Review Payload changelog for migration guides
```

Mark final todo as completed.

#### Success Metrics
**Report** achievement against criteria:
- ✅ Version Alignment: 100% consistent
- ✅ Build Success: Achieved/Failed with recovery
- ✅ Type Safety: Maintained/Issues documented
- ✅ Performance: Under 5-minute target
- ✅ Documentation: Complete report generated
</expectations>

## Error Handling
<error_handling>
**Handle** errors at each PRIME phase:

### Purpose Phase Errors
- Unclear version target: **Default** to latest stable
- Conflicting requirements: **Prompt** for clarification

### Role Phase Errors
- Insufficient permissions: **Request** elevation
- Missing tools: **Verify** pnpm, curl, jq installation

### Inputs Phase Errors
- Context loading fails: **Continue** with cached knowledge
- Dirty git state: **Offer** stash option

### Method Phase Errors
- Package update fails: **Retry** with individual updates
- Type generation hangs: **Check** timestamp fallback
- Build failures: **Clear** caches and retry

### Expectations Phase Errors
- Report generation fails: **Output** to console
- Validation failures: **Document** and continue
</error_handling>
</instructions>

<patterns>
### Implemented Patterns
- **Dynamic Context Loading**: Via context-discovery-expert agent
- **User Clarification**: For major version updates and breaking changes
- **Parallel Execution**: Validation suite runs three streams simultaneously
- **Agent Delegation**: TypeScript and Node.js experts for complex issues
- **Progress Tracking**: TodoWrite integration for step visibility
- **Validation Checks**: Comprehensive pre and post-update validation
- **Error Recovery**: Automatic retry logic and fallback strategies
</patterns>

<help>
📦 **Payload CMS Update Manager**

Systematically updates Payload CMS with intelligent version management and validation.

**Usage:**
- `/update:payload` - Update to latest stable version
- `/update:payload 3.41.0` - Update to specific version
- `/update:payload latest --verbose` - Detailed output mode

**PRIME Process:**
1. **Purpose**: Achieve version alignment across all Payload packages
2. **Role**: Senior engineer with Payload expertise
3. **Inputs**: Gather versions, context, and user preferences
4. **Method**: Execute updates with parallel validation
5. **Expectations**: Deliver validated, working update

**Requirements:**
- Clean or stashed git state recommended
- pnpm, curl, jq installed
- Network access to npm registry

Ready to update Payload CMS with confidence!
</help>