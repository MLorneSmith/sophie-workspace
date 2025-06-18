# Phase Context Flow Analysis

**Date**: 2025-01-15  
**Purpose**: Analyze how output from each phase is used as input to subsequent phases  
**Status**: Critical gaps identified requiring systematic fixes

## Executive Summary

The AI-Assisted Feature Development (AAFD) methodology creates structured outputs at each phase, but has **inconsistent and incomplete logic** for consuming these outputs in subsequent phases. This breaks the continuity of accumulated knowledge and reduces the effectiveness of the structured approach.

**Key Finding**: Only 2 of 6 phase transitions properly load previous phase outputs.

## Current Phase Output Structure

Each phase creates outputs in the standardized directory structure:

```
.claude/build/4-output/
├── contexts/
│   ├── discovery/{feature-slug}/     # Phase 0 outputs
│   ├── epics/epic-{id}/             # Phase 1 outputs
│   ├── chunks/chunk-{id}/           # Phase 2 outputs
│   └── stories/story-{id}/          # Phase 4 outputs
└── {epic-name}/
    ├── 1-prd/                       # Phase 1 structured content
    ├── 2-chunks/                    # Phase 2 structured content
    ├── 3-validation/                # Phase 3 structured content
    ├── 4-stories/                   # Phase 4 structured content
    └── 5-sprints/                   # Phase 5 structured content
```

## Phase-by-Phase Context Flow Analysis

### Phase 0 → Phase 1: ✅ **WORKING**

**Phase 1 (idea-to-prd-prompt.xml) correctly loads Phase 0 outputs:**

```xml
<context_files>
  - {DISCOVERY_CONTEXT_PATH}/business-context.md
  - {DISCOVERY_CONTEXT_PATH}/user-research.md
  - {DISCOVERY_CONTEXT_PATH}/competitive-analysis.md
  - {DISCOVERY_CONTEXT_PATH}/market-trends.md
</context_files>
```

**Context Loading Instructions (lines 102-109):**

```xml
<context_loading>
  <instructions>
    1. Read discovery session output:
       - Read: {DISCOVERY_CONTEXT_PATH}/discovery-summary.md
    2. Read generated context files:
       - Read: {DISCOVERY_CONTEXT_PATH}/business-context.md
       - Read: {DISCOVERY_CONTEXT_PATH}/user-research.md
       - Read: {DISCOVERY_CONTEXT_PATH}/competitive-analysis.md
       - Read: {DISCOVERY_CONTEXT_PATH}/market-trends.md
  </instructions>
</context_loading>
```

**Assessment**: ✅ Complete context handoff with explicit loading instructions.

### Phase 1 → Phase 2: ❌ **BROKEN**

**Phase 2 (create-prd-chunks-prompt.xml) does NOT load Phase 1 outputs:**

**Missing Context Loading:**

- No reference to PRD content from `.claude/build/4-output/{epic-name}/1-prd/prd-content.md`
- No loading of epic context from `.claude/build/4-output/contexts/epics/epic-{epic-id}/prd.md`
- Input section only shows `{STRUCTURED_PRD_CONTENT}` as parameter but no file loading

**Current Context Loading (lines 42-50):**

```xml
<context_loading>
  <instructions>
    Before proceeding, read the context documentation inventory:
    - Read: .claude/docs/.context-docs-inventory.xml
    Based on the PRD's technical requirements, read relevant context:
    - For system patterns: Read architecture/service-patterns.md
    - For state management: Read architecture/state-management.md
    - For performance considerations: Read architecture/performance-optimization.md
    - For debugging approach: Read debugging/debugging-system-overview.md
  </instructions>
</context_loading>
```

**Assessment**: ❌ Missing critical PRD content loading from previous phase.

### Phase 2 → Phase 3: ❌ **BROKEN**

**Phase 3 (stakeholder-validation-prompt.xml) does NOT load Phase 2 outputs:**

**Missing Context Loading:**

- No reference to chunk details from `.claude/build/4-output/{epic-name}/2-chunks/`
- No loading of chunk context from `.claude/build/4-output/contexts/chunks/chunk-{id}/context.md`
- Only receives `{PRD_CHUNK_CONTENT}` as input parameter

**Current Context Loading (lines 42-49):**

```xml
<context_loading>
  <instructions>
    Before proceeding, read the context documentation inventory:
    - Read: .claude/docs/.context-docs-inventory.xml
    Based on the chunk's technical focus, read relevant context:
    - For security validation: Read security/authentication-patterns.md, security/authorization-patterns.md
    - For UI requirements: Read ui/accessibility.md, ui/responsive-design.md
    - For data concerns: Read data/database-schema.md
    - For testing approach: Read testing/unit-testing-prioritization-plan.md
  </instructions>
</context_loading>
```

**Assessment**: ❌ Missing chunk analysis and decomposition results from previous phase.

### Phase 3 → Phase 4: ❌ **BROKEN**

**Phase 4 (create-user-stories-prompt.xml) does NOT load Phase 3 outputs:**

**Missing Context Loading:**

- No reference to validation results from `.claude/build/4-output/{epic-name}/3-validation/`
- No loading of stakeholder feedback
- No reference to approved/refined chunk requirements
- Only receives `{VALIDATED_CHUNK_CONTENT}` as input parameter

**Current Context Loading (lines 44-53):**

```xml
<context_loading>
  <instructions>
    Before proceeding, read the context documentation inventory:
    - Read: .claude/docs/.context-docs-inventory.xml
    Based on the features being implemented, read relevant context:
    - For component patterns: Read ui/component-patterns.md
    - For API patterns: Read architecture/service-patterns.md
    - For data operations: Read data/react-query-patterns.md, data/supabase-patterns.md
    - For testing standards: Read testing/test-case-template.md, testing/context/test-driven-development.md
    - For error handling: Read debugging/error-handling.md
  </instructions>
</context_loading>
```

**Assessment**: ❌ Missing validation results and refined requirements from previous phase.

### Phase 4 → Phase 5: ❌ **BROKEN**

**Phase 5 (create-sprints-prompt.xml) does NOT load Phase 4 outputs:**

**Missing Context Loading:**

- No reference to story details from `.claude/build/4-output/{epic-name}/4-stories/`
- No loading of story context files from `.claude/build/4-output/contexts/stories/story-{id}/`
- No reference to technical breakdown and effort estimates
- Only receives `{USER_STORIES}` as XML parameter

**Current Context Loading (lines 42-52):**

```xml
<context_loading>
  <instructions>
    Before proceeding, read the context documentation inventory:
    - Read: .claude/docs/.context-docs-inventory.xml
    Based on the sprint's technical scope, read relevant context:
    - For TDD approach: Read testing/context/test-driven-development.md
    - For testing patterns: Read testing/context/unit-testing-patterns.md
    - For performance goals: Read architecture/performance-optimization.md
    - For debugging workflow: Read debugging/debugging-system-overview.md
    - For common patterns: Read debugging/common-patterns.md
  </instructions>
</context_loading>
```

**Assessment**: ❌ Missing detailed story context and technical breakdown from previous phase.

### Phase 5 → Phase 6: ⚠️ **PARTIAL**

**Phase 6 prompts have mixed context loading:**

**implementation-prompt.xml (lines 124-148) - ✅ Good:**

```xml
<mandatory_reads>
  <read priority="1">CLAUDE.md - Project standards and conventions</read>
  <read priority="2">.claude/build/4-output/contexts/stories/story-{story_id}/context.md - Story requirements</read>
  <read priority="3">.claude/build/4-output/contexts/stories/story-{story_id}/technical-notes.md - Technical approach</read>
  <read priority="4">.claude/build/4-output/contexts/stories/story-{story_id}/progress.md - Current progress</read>
</mandatory_reads>
```

**execution-tracking-prompt.xml (lines 238-241) - ✅ Good:**

```xml
<required_context>
  <project_standards>CLAUDE.md</project_standards>
  <story_context>.claude/build/4-output/contexts/stories/story-{id}/context.md</story_context>
  <technical_notes>.claude/build/4-output/contexts/stories/story-{id}/technical-notes.md</technical_notes>
  <progress_tracking>.claude/build/4-output/contexts/stories/story-{id}/progress.md</progress_tracking>
</required_context>
```

**Missing Context Loading:**

- No reference to sprint plan from `.claude/build/4-output/{epic-name}/5-sprints/sprint-{number}.md`
- No loading of sprint goal and capacity planning
- No reference to task assignments and dependencies

**Assessment**: ⚠️ Story context loading works, but sprint planning context missing.

## Critical Issues Identified

### 1. **Broken Context Chain**

The methodology creates a wealth of context but fails to use it systematically:

```
Phase 0 (Discovery) → ✅ → Phase 1 (PRD)
Phase 1 (PRD) → ❌ → Phase 2 (Chunking)
Phase 2 (Chunking) → ❌ → Phase 3 (Validation)
Phase 3 (Validation) → ❌ → Phase 4 (Stories)
Phase 4 (Stories) → ❌ → Phase 5 (Sprint Planning)
Phase 5 (Sprint Planning) → ⚠️ → Phase 6 (Implementation)
```

**Impact**: Each phase essentially "starts fresh" instead of building on accumulated knowledge.

### 2. **Inconsistent Input Methods**

Different phases use different approaches to receive previous phase data:

- **Parameter-based**: `{STRUCTURED_PRD_CONTENT}`, `{VALIDATED_CHUNK_CONTENT}`, `{USER_STORIES}`
- **File-based**: Explicit file paths in context loading instructions
- **Mixed approach**: Some combination of both

**Impact**: No standardized pattern for context handoff.

### 3. **Missing Output Specifications**

Some phases don't clearly specify where to store outputs for next phase consumption:

- **Phase 2**: Chunks stored but path references inconsistent
- **Phase 3**: Validation results storage location unclear
- **Phase 5**: Sprint plans created but usage in Phase 6 unclear

**Impact**: Even when outputs are created, subsequent phases don't know where to find them.

### 4. **No Validation of Context Dependencies**

No phase validates that required context from previous phases exists before proceeding.

**Impact**: Phases may proceed without critical context, reducing quality.

## Detailed Fix Requirements

### Phase 2 (Chunking) Fixes

**Add to create-prd-chunks-prompt.xml:**

```xml
<context_loading>
  <from_previous_phase>
    <!-- Load Phase 1 PRD outputs -->
    <read priority="1">.claude/build/4-output/{epic-name}/1-prd/prd-content.md - Complete PRD content</read>
    <read priority="2">.claude/build/4-output/contexts/epics/epic-{epic-id}/prd.md - Epic context</read>
    <read priority="3">.claude/build/4-output/contexts/discovery/{feature-slug}/discovery-summary.md - Original requirements</read>
  </from_previous_phase>
  <current_context>
    <read>.claude/docs/.context-docs-inventory.xml</read>
    <read>architecture/service-patterns.md</read>
    <read>architecture/state-management.md</read>
  </current_context>
</context_loading>
```

### Phase 3 (Validation) Fixes

**Add to stakeholder-validation-prompt.xml:**

```xml
<context_loading>
  <from_previous_phases>
    <!-- Load Phase 2 chunking outputs -->
    <read priority="1">.claude/build/4-output/{epic-name}/2-chunks/chunk-{chunk-id}.md - Chunk analysis</read>
    <read priority="2">.claude/build/4-output/contexts/chunks/chunk-{chunk-id}/context.md - Chunk context</read>
    <read priority="3">.claude/build/4-output/{epic-name}/1-prd/prd-content.md - Original PRD for reference</read>
  </from_previous_phases>
  <current_context>
    <read>.claude/docs/.context-docs-inventory.xml</read>
    <read>security/authentication-patterns.md</read>
    <read>ui/accessibility.md</read>
  </current_context>
</context_loading>
```

### Phase 4 (Stories) Fixes

**Add to create-user-stories-prompt.xml:**

```xml
<context_loading>
  <from_previous_phases>
    <!-- Load Phase 3 validation outputs -->
    <read priority="1">.claude/build/4-output/{epic-name}/3-validation/stakeholder-feedback.md - Validation results</read>
    <read priority="2">.claude/build/4-output/{epic-name}/2-chunks/chunk-{chunk-id}.md - Validated chunk details</read>
    <read priority="3">.claude/build/4-output/contexts/chunks/chunk-{chunk-id}/context.md - Chunk context</read>
    <read priority="4">.claude/build/4-output/{epic-name}/1-prd/prd-content.md - Original PRD for user personas</read>
  </from_previous_phases>
  <current_context>
    <read>.claude/docs/.context-docs-inventory.xml</read>
    <read>ui/component-patterns.md</read>
    <read>testing/test-case-template.md</read>
  </current_context>
</context_loading>
```

### Phase 5 (Sprint Planning) Fixes

**Add to create-sprints-prompt.xml:**

```xml
<context_loading>
  <from_previous_phases>
    <!-- Load Phase 4 story outputs -->
    <read priority="1">.claude/build/4-output/{epic-name}/4-stories/stories-breakdown.md - Complete story analysis</read>
    <read priority="2">.claude/build/4-output/contexts/stories/story-{id}/context.md - Individual story contexts</read>
    <read priority="3">.claude/build/4-output/contexts/stories/story-{id}/technical-notes.md - Technical requirements</read>
    <read priority="4">.claude/build/4-output/{epic-name}/3-validation/stakeholder-feedback.md - Priority guidance</read>
  </from_previous_phases>
  <current_context>
    <read>.claude/docs/.context-docs-inventory.xml</read>
    <read>testing/context/test-driven-development.md</read>
    <read>architecture/performance-optimization.md</read>
  </current_context>
</context_loading>
```

### Phase 6 (Implementation) Fixes

**Add to all Phase 6 prompts:**

```xml
<context_loading>
  <from_previous_phases>
    <!-- Load Phase 5 sprint planning outputs -->
    <read priority="1">.claude/build/4-output/{epic-name}/5-sprints/sprint-{number}.md - Sprint plan and assignments</read>
    <read priority="2">.claude/build/4-output/contexts/stories/story-{story_id}/context.md - Story requirements</read>
    <read priority="3">.claude/build/4-output/contexts/stories/story-{story_id}/technical-notes.md - Technical approach</read>
    <read priority="4">.claude/build/4-output/contexts/stories/story-{story_id}/progress.md - Current progress</read>
  </from_previous_phases>
  <project_context>
    <read priority="1">CLAUDE.md - Project standards and conventions</read>
  </project_context>
</context_loading>
```

## Standardization Requirements

### 1. **Consistent Context Loading Pattern**

All phases should use this standardized structure:

```xml
<context_loading>
  <from_previous_phases>
    <!-- Explicit file paths to previous phase outputs -->
  </from_previous_phases>
  <project_context>
    <!-- Project-specific context files -->
  </project_context>
  <validation>
    <!-- Check that required files exist before proceeding -->
  </validation>
</context_loading>
```

### 2. **Output Path Standardization**

Ensure all phases use consistent output paths:

```
.claude/build/4-output/
├── contexts/                    # Context files for Claude sessions
│   ├── discovery/{feature-slug}/
│   ├── epics/epic-{id}/
│   ├── chunks/chunk-{id}/
│   └── stories/story-{id}/
└── {epic-name}/                 # Phase-specific structured outputs
    ├── 1-prd/
    ├── 2-chunks/
    ├── 3-validation/
    ├── 4-stories/
    └── 5-sprints/
```

### 3. **Context Dependency Validation**

Add validation logic to each phase:

```xml
<validation>
  <required_files>
    <file path="{PATH}" description="{PURPOSE}"/>
  </required_files>
  <actions>
    <on_missing>Error with specific file paths and instructions</on_missing>
    <on_present>Proceed with phase execution</on_present>
  </actions>
</validation>
```

## Implementation Priority

### High Priority (Critical Fixes)

1. **Phase 2 → 3 → 4 → 5 context loading** - Core methodology broken without this
2. **Output path standardization** - Ensures files can be found
3. **build-feature.md updates** - Document the complete context flow

### Medium Priority (Quality Improvements)

1. **Context dependency validation** - Prevents proceeding without required context
2. **Handoff protocol documentation** - Clear specifications for each transition
3. **Context refresh logic** - Handle stale context across sessions

### Low Priority (Future Enhancements)

1. **Automated context linking** - Tools to automatically discover related contexts
2. **Context compression** - Summarize large contexts for efficiency
3. **Context version control** - Track changes to context files

## Validation Testing

To validate fixes, test each phase transition:

1. **Create minimal test case** for each phase
2. **Verify context files** are created in correct locations
3. **Test subsequent phase** can load previous phase outputs
4. **Validate error handling** when context files are missing
5. **End-to-end test** through complete methodology

## Success Metrics

### Quantitative Measures

- **Context Loading Coverage**: 6/6 phase transitions properly load previous outputs
- **File Path Consistency**: 100% of phases use standardized output paths
- **Context Validation**: 100% of phases validate required inputs exist

### Qualitative Measures

- **Knowledge Continuity**: Each phase builds meaningfully on previous work
- **Decision Traceability**: Can trace decisions back through phase outputs
- **Claude Context Quality**: Phases have all necessary context for high-quality outputs

## Conclusion

The AAFD methodology has a solid structural foundation but suffers from **broken context flow** between phases. The systematic fixes outlined above will:

1. **Restore knowledge continuity** across the methodology
2. **Improve output quality** by providing complete context
3. **Reduce repeated work** by leveraging previous analysis
4. **Enable better decision tracking** through connected phase outputs

**Next Steps**: Implement the context loading fixes for Phases 2-5 as the highest priority to restore the methodology's effectiveness.
