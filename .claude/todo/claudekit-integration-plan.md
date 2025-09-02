# ClaudeKit Integration Project Plan

## Executive Summary

This document outlines the plan to integrate valuable features from ClaudeKit (https://github.com/carlrannaberg/claudekit) into our existing `.claude/` infrastructure through selective feature extraction, avoiding the complexity of managing two separate systems.

## ClaudeKit Repository Analysis

### What is ClaudeKit
ClaudeKit is a Node.js CLI tool (v0.8.12) that provides:
- **Smart guardrails** for Claude Code development
- **Hook system** for real-time validation and error prevention  
- **Command library** with specialized workflows
- **Agent system** for spawning focused sub-agents
- **Checkpoint system** for Git-based work preservation
- **Codebase mapping** for instant project understanding

### Technical Architecture
- **Language**: TypeScript/JavaScript
- **Package Manager**: npm (conflicts with our pnpm)
- **Linting**: Assumes ESLint/Prettier (conflicts with our Biome)
- **Structure**: 
  - Commands: Markdown files with frontmatter
  - Agents: Markdown instruction templates
  - Hooks: TypeScript classes extending BaseHook
  - Configuration: `.claudekit/config.json`

### Key Findings
1. **Most features are extractable** - Commands and agents are just markdown files
2. **Hook system is adaptable** - Can be reimplemented as shell scripts
3. **No complex dependencies** - Core features don't require the npm package
4. **Biome conflict is manageable** - Can create adapter hooks

## Integration Strategy Decision

### Options Evaluated
1. ~~Full ClaudeKit adoption~~ - Too complex, ESLint/Prettier conflicts
2. **✅ Selective Feature Extraction** - Extract valuable features into `.claude/`
3. ~~Parallel installation~~ - Two systems would cause confusion
4. ~~Custom hook bridge~~ - Unnecessary complexity

### Chosen Approach: Selective Feature Extraction
**Rationale:**
- Maintains single `.claude/` directory (no confusion)
- Full control over implementation
- Perfect integration with Biome and pnpm
- No external dependencies
- Gradual, low-risk implementation

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal:** Establish core infrastructure and high-value, low-complexity features

#### 1.1 Codebase Mapping System
**Priority:** HIGH | **Complexity:** LOW | **Value:** IMMEDIATE

**Implementation:**
```bash
# Location: .claude/hooks/codebase-map.sh
# Trigger: First user prompt in session
# Output: Project structure overview
```

**Tasks:**
- [ ] Create codebase mapping script using `tree` command
- [ ] Add session tracking to avoid regeneration
- [ ] Configure exclusion patterns (node_modules, dist, .next)
- [ ] Integrate with `.claude/settings.json` hooks
- [ ] Test with new Claude sessions

**Testing Steps:**
1. **Unit Test**: Run script manually
   ```bash
   SESSION_ID=test-123 .claude/hooks/codebase-map.sh
   # Expected: Tree output with proper exclusions
   ```
2. **Session Tracking Test**:
   ```bash
   SESSION_ID=test-456 .claude/hooks/codebase-map.sh
   SESSION_ID=test-456 .claude/hooks/codebase-map.sh  # Run again
   # Expected: Second run returns cached result
   ```
3. **Integration Test**: 
   - Start new Claude session
   - Type "What files are in this project?"
   - Verify Claude mentions the structure without searching
4. **Performance Test**:
   - Measure execution time: `time .claude/hooks/codebase-map.sh`
   - Expected: <500ms for average project

**Success Metrics:**
- Claude receives project structure on first interaction
- No performance impact on subsequent prompts
- Proper filtering of irrelevant directories
- Execution time <500ms

#### 1.2 Git Checkpoint System  
**Priority:** HIGH | **Complexity:** LOW | **Value:** HIGH

**Implementation:**
```bash
# Location: .claude/hooks/auto-checkpoint.sh
# Trigger: Claude session end
# Function: Auto-stash with managed rotation
```

**Tasks:**
- [ ] Create checkpoint creation script
- [ ] Implement stash rotation (keep last 10)
- [ ] Add checkpoint listing command
- [ ] Create checkpoint restore command
- [ ] Test checkpoint lifecycle

**Testing Steps:**
1. **Manual Checkpoint Creation**:
   ```bash
   # Make some changes
   echo "test" > test-file.txt
   # Run checkpoint script
   .claude/hooks/auto-checkpoint.sh
   # Verify stash created
   git stash list | grep "claude-checkpoint"
   ```
2. **Rotation Test**:
   ```bash
   # Create 12 checkpoints
   for i in {1..12}; do
     echo "change $i" > test-$i.txt
     .claude/hooks/auto-checkpoint.sh
   done
   # Verify only 10 remain
   git stash list | grep "claude-checkpoint" | wc -l
   # Expected: 10
   ```
3. **Restore Test**:
   ```bash
   # List checkpoints
   .claude/commands/checkpoint-list.sh
   # Restore specific checkpoint
   .claude/commands/checkpoint-restore.sh stash@{0}
   # Verify restoration
   git status
   ```
4. **No-Changes Test**:
   ```bash
   # With clean working directory
   git status --porcelain  # Should be empty
   .claude/hooks/auto-checkpoint.sh
   # Verify no new stash created
   ```

**Success Metrics:**
- Automatic work preservation on session end
- Easy restoration of previous states
- No interference with normal git workflow
- Stash rotation maintains exactly 10 checkpoints

#### 1.3 Thinking Level Enhancement
**Priority:** MEDIUM | **Complexity:** TRIVIAL | **Value:** MEDIUM

**Implementation:**
```bash
# Location: .claude/hooks/thinking-level.sh
# Trigger: User prompt submission
# Function: Inject thinking keywords
```

**Tasks:**
- [ ] Create thinking level script
- [ ] Add configuration to settings.json
- [ ] Document thinking levels (0-3)
- [ ] Test impact on Claude responses

**Testing Steps:**
1. **Keyword Injection Test**:
   ```bash
   THINKING_LEVEL=0 .claude/hooks/thinking-level.sh  # Empty
   THINKING_LEVEL=1 .claude/hooks/thinking-level.sh  # "think"
   THINKING_LEVEL=2 .claude/hooks/thinking-level.sh  # "megathink"
   THINKING_LEVEL=3 .claude/hooks/thinking-level.sh  # "ultrathink"
   ```
2. **Response Quality Test**:
   - Level 0: Ask "What is 2+2?"
   - Level 3: Ask "What is 2+2?"
   - Compare response lengths and reasoning depth
3. **Complex Problem Test**:
   - Set level 3
   - Ask complex architectural question
   - Verify step-by-step reasoning appears

**Success Metrics:**
- Configurable thinking depth
- Improved reasoning on complex tasks
- No negative impact on simple queries
- Correct keyword injection per level

### Phase 2: Security & Validation (Week 2)
**Goal:** Add protective measures and code quality automation

#### 2.1 File Guard Security System
**Priority:** CRITICAL | **Complexity:** MEDIUM | **Value:** CRITICAL

**Implementation:**
```javascript
// Location: .claude/hooks/file-guard.js
// Trigger: Pre-tool use (Read/Write/Edit)
// Function: Block sensitive file access
```

**Tasks:**
- [ ] Create `.aiignore` pattern file
- [ ] Implement pattern matching logic
- [ ] Add default sensitive patterns (.env, *.key, etc.)
- [ ] Create bypass mechanism for legitimate needs
- [ ] Test with various file access attempts

**Patterns to protect:**
- Environment files (.env, .env.*)
- SSH keys (id_rsa, *.pem)
- Cloud credentials (credentials, *.json)
- API keys and tokens
- Database configs
- Cryptocurrency wallets

**Testing Steps:**
1. **Pattern Matching Test**:
   ```bash
   # Create test files
   touch .env .env.local id_rsa credentials.json
   # Test each pattern
   node .claude/hooks/file-guard.js .env          # BLOCKED
   node .claude/hooks/file-guard.js .env.local    # BLOCKED
   node .claude/hooks/file-guard.js id_rsa        # BLOCKED
   node .claude/hooks/file-guard.js package.json  # ALLOWED
   ```
2. **Bash Command Test**:
   ```bash
   # Test dangerous commands
   COMMAND="cat .env" node .claude/hooks/file-guard.js
   # Expected: Access denied
   
   COMMAND="cat .env | grep KEY" node .claude/hooks/file-guard.js
   # Expected: Access denied
   
   COMMAND="echo 'test'" node .claude/hooks/file-guard.js
   # Expected: Allowed
   ```
3. **False Positive Test**:
   ```bash
   # Test legitimate files
   node .claude/hooks/file-guard.js README.md      # ALLOWED
   node .claude/hooks/file-guard.js src/index.ts   # ALLOWED
   node .claude/hooks/file-guard.js .gitignore     # ALLOWED
   ```
4. **Integration Test with Claude**:
   - Ask Claude to "read the .env file"
   - Expected: Hook blocks access with clear error
   - Ask Claude to "read package.json"
   - Expected: Access allowed

**Success Metrics:**
- Zero accidental exposure of sensitive files
- Clear error messages when access denied
- No false positives on legitimate files
- 100% blocking rate for sensitive patterns

#### 2.2 Biome Integration Hooks
**Priority:** HIGH | **Complexity:** MEDIUM | **Value:** HIGH

**Implementation:**
```bash
# Location: .claude/hooks/post-edit-biome.sh
# Trigger: After file modifications
# Function: Run Biome checks
```

**Tasks:**
- [ ] Create post-edit Biome validation hook
- [ ] Create project-wide Biome check hook
- [ ] Add format-on-save functionality
- [ ] Integrate with existing codecheck command
- [ ] Configure for TypeScript/JavaScript files only

**Testing Steps:**
1. **File Edit Test**:
   ```bash
   # Create test file with formatting issues
   echo "const x={a:1,b:2}" > test.ts
   # Run hook
   FILE=test.ts .claude/hooks/post-edit-biome.sh
   # Verify formatted
   cat test.ts  # Should show formatted code
   ```
2. **File Type Filter Test**:
   ```bash
   FILE=test.md .claude/hooks/post-edit-biome.sh   # Skip
   FILE=test.ts .claude/hooks/post-edit-biome.sh   # Run
   FILE=test.jsx .claude/hooks/post-edit-biome.sh  # Run
   FILE=test.py .claude/hooks/post-edit-biome.sh   # Skip
   ```
3. **Error Detection Test**:
   ```bash
   # Create file with linting error
   echo "const x: any = 1" > test-any.ts
   FILE=test-any.ts .claude/hooks/post-edit-biome.sh
   # Expected: Error about 'any' type
   ```
4. **Performance Test**:
   ```bash
   # Time execution on large file
   time FILE=apps/web/app/page.tsx .claude/hooks/post-edit-biome.sh
   # Expected: <2 seconds
   ```

**Success Metrics:**
- Automatic linting after file changes
- Immediate feedback on code issues
- Consistent code formatting
- Integration with existing pnpm scripts
- <2s execution time per file

#### 2.3 TypeScript Validation Hooks
**Priority:** HIGH | **Complexity:** LOW | **Value:** HIGH

**Implementation:**
```bash
# Location: .claude/hooks/typecheck-changed.sh
# Trigger: After TypeScript file changes
# Function: Run type checking
```

**Tasks:**
- [ ] Create file-specific type check hook
- [ ] Create project-wide type check hook
- [ ] Add detection for 'any' types
- [ ] Integrate with existing typecheck wrapper
- [ ] Add caching for performance

**Testing Steps:**
1. **Type Error Detection Test**:
   ```bash
   # Create file with type error
   echo "const x: string = 123" > test-type.ts
   FILE=test-type.ts .claude/hooks/typecheck-changed.sh
   # Expected: Type error detected
   ```
2. **Any Type Detection Test**:
   ```bash
   echo "const x: any = 'test'" > test-any.ts
   FILE=test-any.ts .claude/hooks/typecheck-changed.sh
   # Expected: Error about 'any' usage
   ```
3. **Project-wide Check Test**:
   ```bash
   .claude/hooks/typecheck-project.sh
   # Should run: pnpm typecheck:raw --force
   # Verify all errors reported
   ```
4. **Cache Performance Test**:
   ```bash
   # First run
   time FILE=large-file.ts .claude/hooks/typecheck-changed.sh
   # Second run (cached)
   time FILE=large-file.ts .claude/hooks/typecheck-changed.sh
   # Expected: Second run significantly faster
   ```

**Success Metrics:**
- Immediate type error detection
- Prevention of 'any' type additions
- Fast incremental checking (<1s for single file)
- Clear error reporting with file:line references

### Phase 3: Commands & Agents (Week 3)
**Goal:** Import valuable commands and agent templates

#### 3.1 Command Library Import
**Priority:** MEDIUM | **Complexity:** LOW | **Value:** MEDIUM

**Commands to import:**
- [ ] `git/status.md` - Enhanced git status
- [ ] `git/commit.md` - Smart commit creation
- [ ] `checkpoint/list.md` - List checkpoints
- [ ] `checkpoint/restore.md` - Restore checkpoints
- [ ] `code-review.md` - Multi-agent review
- [ ] `research.md` - Research workflow
- [ ] `spec/create.md` - Spec generation

**Tasks:**
- [ ] Review each command for compatibility
- [ ] Adapt tool restrictions for our setup
- [ ] Update paths and references
- [ ] Test each command individually
- [ ] Document in command index

**Testing Steps:**
1. **Command Execution Test**:
   ```bash
   # Test each imported command
   /git:status     # Should show enhanced git analysis
   /git:commit     # Should create smart commit
   /checkpoint:list # Should list all checkpoints
   ```
2. **Tool Restriction Test**:
   - Verify commands only use allowed tools
   - Test that restricted tools are blocked
3. **Integration Test**:
   - Run command sequence: status → commit → push
   - Verify workflow completion

#### 3.2 Agent Templates Import
**Priority:** MEDIUM | **Complexity:** LOW | **Value:** MEDIUM

**Agents to import:**
- [ ] `code-search.md` - Efficient code searching
- [ ] `typescript-expert.md` - TypeScript specialist
- [ ] `react-expert.md` - React best practices
- [ ] `database/postgres-expert.md` - PostgreSQL expert
- [ ] `refactoring/safe-refactor.md` - Safe refactoring

**Tasks:**
- [ ] Create `.claude/agents/` directory
- [ ] Import and adapt agent templates
- [ ] Create agent launcher command
- [ ] Test agent invocation
- [ ] Document available agents

**Testing Steps:**
1. **Agent Launch Test**:
   ```bash
   # Test agent invocation
   /agent code-search "find authentication"
   /agent typescript-expert "review this type"
   ```
2. **Tool Restriction Test**:
   - Verify agents only use specified tools
   - Test that agents respect boundaries
3. **Performance Test**:
   - Measure agent response time
   - Verify parallel tool usage

### Phase 4: Advanced Features (Week 4)
**Goal:** Implement sophisticated workflows and optimizations

#### 4.1 Test Integration Hooks
**Priority:** MEDIUM | **Complexity:** MEDIUM | **Value:** HIGH

**Implementation:**
```bash
# Location: .claude/hooks/test-changed.sh
# Trigger: After code changes
# Function: Run relevant tests
```

**Tasks:**
- [ ] Create test detection logic
- [ ] Integrate with existing test controller
- [ ] Add test result parsing
- [ ] Create test failure notifications
- [ ] Add coverage tracking

**Testing Steps:**
1. **Test Detection**:
   ```bash
   # Change a component file
   echo "// change" >> src/component.tsx
   # Hook should detect and run component.test.tsx
   ```
2. **Test Execution**:
   ```bash
   FILE=src/utils.ts .claude/hooks/test-changed.sh
   # Should run: pnpm test src/utils.test.ts
   ```
3. **Failure Notification**:
   - Introduce test failure
   - Verify clear error reporting
   - Check that Claude receives feedback

**Success Metrics:**
- Automatic test execution for changed code
- Fast feedback on test failures (<5s)
- Integration with existing test infrastructure
- Accurate test file mapping

#### 4.2 Code Review Workflow
**Priority:** LOW | **Complexity:** HIGH | **Value:** MEDIUM

**Tasks:**
- [ ] Adapt multi-agent review system
- [ ] Create review report template
- [ ] Add severity classification
- [ ] Integrate with PR workflow
- [ ] Test with real code changes

#### 4.3 Performance Optimizations
**Priority:** LOW | **Complexity:** MEDIUM | **Value:** LOW

**Tasks:**
- [ ] Add hook execution profiling
- [ ] Implement result caching
- [ ] Create performance dashboard
- [ ] Optimize slow operations
- [ ] Document performance tips

## Implementation Timeline

### Week 1 (Days 1-7): Foundation
- **Day 1-2**: Codebase mapping system
- **Day 3-4**: Git checkpoint system  
- **Day 5**: Thinking level enhancement
- **Day 6-7**: Testing and documentation

### Week 2 (Days 8-14): Security & Validation
- **Day 8-9**: File guard security system
- **Day 10-11**: Biome integration hooks
- **Day 12-13**: TypeScript validation hooks
- **Day 14**: Integration testing

### Week 3 (Days 15-21): Commands & Agents
- **Day 15-17**: Command library import
- **Day 18-20**: Agent templates import
- **Day 21**: Command/agent testing

### Week 4 (Days 22-28): Advanced Features
- **Day 22-24**: Test integration hooks
- **Day 25-26**: Code review workflow
- **Day 27**: Performance optimizations
- **Day 28**: Final testing and documentation

## Risk Mitigation

### Identified Risks
1. **Hook conflicts with existing scripts**
   - Mitigation: Careful integration testing, gradual rollout
   
2. **Performance impact from hooks**
   - Mitigation: Profiling, caching, async execution where possible
   
3. **Biome compatibility issues**
   - Mitigation: Custom adapters, thorough testing
   
4. **User confusion with new features**
   - Mitigation: Clear documentation, gradual introduction

## Success Criteria

### Quantitative Metrics
- [ ] Zero sensitive file exposures
- [ ] <100ms hook execution time
- [ ] 100% Biome compatibility maintained
- [ ] No false positive validations

### Qualitative Metrics  
- [ ] Improved Claude understanding of codebase
- [ ] Faster error detection and correction
- [ ] Safer refactoring operations
- [ ] Better code quality consistency

## Directory Structure (Final State)

```
.claude/
├── hooks/                      # Hook scripts
│   ├── codebase-map.sh        # Session initialization
│   ├── auto-checkpoint.sh     # Git safety
│   ├── file-guard.js          # Security
│   ├── post-edit-biome.sh     # Linting
│   ├── typecheck-changed.sh   # Type validation
│   ├── test-changed.sh        # Test runner
│   └── thinking-level.sh      # Reasoning enhancement
├── agents/                     # Agent templates (NEW)
│   ├── code-search.md
│   ├── typescript-expert.md
│   └── ...
├── commands/                   # Existing + imported commands
│   ├── (existing commands)
│   └── (imported from ClaudeKit)
├── scripts/                    # Existing test scripts
├── patterns/                   # Security patterns (NEW)
│   └── .aiignore
└── settings.json              # Enhanced with hook config

```

## Maintenance Plan

### Weekly Tasks
- Review hook execution logs
- Update security patterns
- Check for ClaudeKit updates to cherry-pick

### Monthly Tasks
- Performance profiling
- User feedback collection  
- Feature usage analytics
- Documentation updates

### Quarterly Tasks
- Major feature additions from ClaudeKit
- Security audit of patterns
- Performance optimization review

## Testing & Validation Framework

### Test Execution Checklist

Each feature must pass the following validation stages before being considered complete:

#### Stage 1: Unit Testing
- [ ] Feature runs without errors in isolation
- [ ] Expected output matches specification
- [ ] Edge cases handled gracefully
- [ ] Error messages are clear and actionable

#### Stage 2: Integration Testing  
- [ ] Feature integrates with existing hooks/scripts
- [ ] No conflicts with current .claude setup
- [ ] Works with pnpm and Biome toolchain
- [ ] Settings.json configuration works correctly

#### Stage 3: Claude Integration Testing
- [ ] Claude can trigger the feature appropriately
- [ ] Output is properly formatted for Claude
- [ ] Error handling doesn't break Claude session
- [ ] Performance doesn't impact Claude responsiveness

#### Stage 4: Regression Testing
- [ ] Existing features continue to work
- [ ] No performance degradation
- [ ] No new security vulnerabilities
- [ ] Documentation remains accurate

### Test Environment Setup

```bash
# Create test environment
mkdir -p .claude/tests
cd .claude/tests

# Test data setup
touch .env test.ts test.js README.md
echo "SENSITIVE_KEY=secret" > .env
echo "const x: any = 1" > test-any.ts
echo "const y={a:1,b:2}" > test-format.ts
```

### Automated Test Runner

Create `.claude/tests/run-all-tests.sh`:
```bash
#!/bin/bash
# Comprehensive test suite for ClaudeKit features

echo "Running ClaudeKit Integration Tests..."

# Test each feature
./test-codebase-map.sh
./test-checkpoints.sh
./test-file-guard.sh
./test-biome-hooks.sh
./test-typecheck-hooks.sh

# Report results
echo "Test Summary:"
echo "- Passed: $PASSED"
echo "- Failed: $FAILED"
```

### Performance Benchmarks

All hooks must meet these performance targets:
- **Codebase mapping**: <500ms
- **File guard check**: <50ms per file
- **Biome validation**: <2s per file
- **TypeScript check**: <1s per file (cached)
- **Checkpoint creation**: <200ms
- **Hook overhead**: <100ms total

### Success Validation

Before marking any phase complete:
1. All unit tests pass
2. Integration tests show no conflicts
3. Claude successfully uses the feature
4. Performance benchmarks met
5. Documentation updated
6. Code reviewed for security issues

## Conclusion

This plan provides a low-risk, high-value approach to integrating ClaudeKit's best features while maintaining our existing infrastructure. The selective extraction strategy ensures we get the benefits without the complexity of managing two systems or dealing with tool conflicts.

The phased approach allows for gradual adoption with clear success metrics at each stage. Most importantly, we maintain full control over our development environment while enhancing Claude's capabilities significantly.

## Next Steps

1. Review and approve this plan
2. Create feature branch: `feature/claudekit-integration`
3. Begin Phase 1 implementation
4. Schedule weekly progress reviews
5. Document learnings for team knowledge sharing

---

*Document created: 2025-09-02*  
*Last updated: 2025-09-02*  
*Status: PENDING APPROVAL*

## Appendix: Test Scripts

### A.1 Codebase Map Test Script
```bash
#!/bin/bash
# .claude/tests/test-codebase-map.sh

echo "Testing Codebase Map..."

# Test 1: Basic execution
SESSION_ID=test-map-1 ../hooks/codebase-map.sh > /tmp/map1.txt
if [ -s /tmp/map1.txt ]; then
  echo "✓ Map generated"
else
  echo "✗ Map generation failed"
fi

# Test 2: Caching
SESSION_ID=test-map-2 ../hooks/codebase-map.sh > /tmp/map2a.txt
SESSION_ID=test-map-2 ../hooks/codebase-map.sh > /tmp/map2b.txt
if [ "$(wc -l < /tmp/map2b.txt)" -lt "$(wc -l < /tmp/map2a.txt)" ]; then
  echo "✓ Caching works"
else
  echo "✗ Caching failed"
fi

# Test 3: Exclusions
if grep -q "node_modules" /tmp/map1.txt; then
  echo "✗ Failed to exclude node_modules"
else
  echo "✓ Exclusions work"
fi
```

### A.2 File Guard Test Script
```bash
#!/bin/bash
# .claude/tests/test-file-guard.sh

echo "Testing File Guard..."

# Test sensitive files
for file in .env .env.local id_rsa credentials.json; do
  if node ../hooks/file-guard.js "$file" 2>/dev/null; then
    echo "✗ Failed to block $file"
  else
    echo "✓ Blocked $file"
  fi
done

# Test allowed files
for file in README.md package.json src/index.ts; do
  if node ../hooks/file-guard.js "$file" 2>/dev/null; then
    echo "✓ Allowed $file"
  else
    echo "✗ Incorrectly blocked $file"
  fi
done
```