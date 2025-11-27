# Command Quality Improvement Implementation Plan

## Overview

Complete enhancement of 6 remaining F-grade commands to achieve quality targets.

**Current State:**

- 6 commands scoring 46-50/100 (F grade)
- Average score: 62.9/100
- Target: Eliminate all F-grades, achieve 70+ average

## Priority Order & Time Estimates

### Phase 1: Critical Git Commands (1 hour)

1. **`/git/status`** (49→85) - 20 min
   - Add PRIME framework structure
   - Implement git analysis patterns
   - Add MCP integration

2. **`/checkpoint/create`** (47→85) - 20 min
   - Complete PRIME phases
   - Add validation & error handling
   - Implement stash management patterns

3. **`/checkpoint/restore`** (47→85) - 20 min
   - Add PURPOSE, ROLE, INPUTS phases
   - Convert to action-first design
   - Add recovery procedures

### Phase 2: Deployment & Migration (1 hour)

1. **`/promote-to-production`** (50→85) - 20 min
   - Add frontmatter description
   - Complete PRIME implementation
   - Add deployment validation

2. **`/agents-md/migration`** (50→85) - 20 min
   - Convert to action-oriented
   - Complete PRIME structure
   - Add migration patterns

3. **`/dev/cleanup`** (47→85) - 20 min
   - Fix PURPOSE phase
   - Add ROLE definition
   - Integrate MCP tools

## Enhancement Template

Each command will receive:

```yaml
Structure:
  - Complete frontmatter (description, allowed-tools, argument-hint)
  - All 5 PRIME phases (PURPOSE, ROLE, INPUTS, METHOD, EXPECTATIONS)
  - Action-first language throughout
  - Error handling section
  - Delegation guidelines
  - Help section with examples

Key Improvements:
  - Replace advisory language with action verbs
  - Add dynamic context loading where appropriate
  - Implement validation checks
  - Include error recovery procedures
  - Add usage examples with expected outputs
```

## Success Metrics

### Immediate Goals

- [ ] No F-grade commands (currently 23)
- [ ] Average score ≥ 70/100 (currently 62.9)
- [ ] All commands have PRIME structure
- [ ] 100% action-first design

### Quality Indicators

- Each enhanced command scores 80+/100
- PRIME compliance: 90%+
- Documentation quality: 85%+
- Integration patterns: 70%+

## Testing & Validation

### After Each Enhancement

1. Run individual command evaluation
2. Verify PRIME phases present
3. Check action verb usage
4. Test error handling

### Final Validation

1. Run full quality evaluation suite
2. Generate comparison report
3. Verify all F-grades eliminated
4. Confirm average score improvement

## Implementation Steps

### For Each Command:

1. **Backup**: Create timestamped backup
2. **Read**: Analyze current implementation
3. **Enhance**: Apply PRIME template
4. **Validate**: Check improvements
5. **Test**: Verify functionality

### Batch Processing

```bash
# Commands to enhance
COMMANDS=(
  "git/status"
  "checkpoint/create"
  "checkpoint/restore"
  "promote-to-production"
  "agents-md/migration"
  "dev/cleanup"
)

# Process each with enhancement template
for cmd in "${COMMANDS[@]}"; do
  # Apply PRIME enhancement
  # Validate improvements
done
```

## Risk Mitigation

### Potential Issues

1. **Time Overrun**: Strict 20-min timebox per command
2. **Quality Regression**: Test after each change
3. **Breaking Changes**: Maintain backups
4. **Scope Creep**: Focus only on quality metrics

### Rollback Strategy

- All original files backed up with timestamps
- Can restore any command if issues arise
- Git history preserves all changes

## Expected Outcomes

### Quantitative

- F-grade commands: 23 → 0
- Average score: 62.9 → 75+
- B-grade or higher: 6 → 15+

### Qualitative

- Consistent command structure
- Clear action-oriented language
- Comprehensive error handling
- Better user experience

## Timeline

**Total Estimated Time**: 2 hours

- Hour 1: Git/checkpoint commands (Phase 1)
- Hour 2: Deployment/migration commands (Phase 2)
- Final 30 min: Validation & reporting

## Next Steps

1. Begin with `/git/status` enhancement
2. Apply template systematically
3. Track progress with TodoWrite
4. Generate final report upon completion
