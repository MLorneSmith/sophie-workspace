# Required Templates for AI-Assisted Feature Development (AAFD) v2.0

This document lists all templates required for implementing the AAFD methodology, organized by phase with GitHub Projects integration recommendations.

## Template Categories

- **GitHub Projects Templates**: Issue templates integrated with GitHub Projects
- **XML Prompt Templates**: Structured prompts for Claude Code automation
- **Markdown Templates**: Context management and planning documents

---

## Phase 1: Ideation & PRD Creation

### Templates Required

| Template Name                    | Type            | GitHub Projects | Priority | Purpose                                   |
| -------------------------------- | --------------- | --------------- | -------- | ----------------------------------------- |
| Feature Epic Issue Template      | GitHub Template | ✅ **YES**      | **High** | Structured PRD creation in GitHub Issues  |
| Feature Planning Prompt Template | XML Prompt      | ❌ No           | High     | Claude Code automation for PRD generation |
| Context Documentation Inventory  | XML Reference   | ❌ No           | Medium   | Context loading guide for Claude          |

### GitHub Projects Integration

- Epic issue template with structured PRD fields
- Custom fields: Feature Type, AAFD Stage, Priority, AI Context Status
- Auto-assignment to "Idea" column in Planning Board

---

## Phase 2: Technical Chunking & Analysis

### Templates Required

| Template Name                       | Type            | GitHub Projects | Priority | Purpose                                   |
| ----------------------------------- | --------------- | --------------- | -------- | ----------------------------------------- |
| Chunk Issue Template                | GitHub Template | ✅ **YES**      | **High** | Track technical chunks in GitHub Projects |
| PRD Chunking Prompt Template        | XML Prompt      | ❌ No           | High     | Claude automation for chunk creation      |
| Chunk Validation Prompt Template    | XML Prompt      | ❌ No           | High     | Claude automation for chunk validation    |
| Cross-cutting Dependencies Template | Markdown        | ❌ No           | Medium   | Document shared concerns across chunks    |

### GitHub Projects Integration

- Chunk issue template linking to parent epic
- Tracks chunk boundaries and dependencies
- Auto-movement to "Chunks" column

---

## Phase 3: Stakeholder Validation

### Templates Required

| Template Name                          | Type        | GitHub Projects | Priority | Purpose                                  |
| -------------------------------------- | ----------- | --------------- | -------- | ---------------------------------------- |
| Chunk Priority Matrix Template         | GitHub View | ✅ **YES**      | **High** | Visual prioritization in GitHub Projects |
| Stakeholder Validation Prompt Template | XML Prompt  | ❌ No           | High     | Claude automation for validation         |
| Stakeholder Review Template            | Markdown    | ❌ No           | Medium   | Structure stakeholder feedback           |
| Risk Assessment Template               | Markdown    | ❌ No           | Medium   | Document risks and mitigation            |

### GitHub Projects Integration

- Validation tracking in chunk issues
- Priority matrix view for stakeholder decisions
- Validation status custom fields

---

## Phase 4: User Story Creation & Refinement

### Templates Required

| Template Name                       | Type            | GitHub Projects | Priority | Purpose                                |
| ----------------------------------- | --------------- | --------------- | -------- | -------------------------------------- |
| User Story Issue Template           | GitHub Template | ✅ **YES**      | **High** | Standard story format in GitHub Issues |
| User Story Creation Prompt Template | XML Prompt      | ❌ No           | High     | Claude automation for story generation |
| Acceptance Criteria Template        | Markdown        | ❌ No           | Medium   | Structure acceptance criteria          |
| Story Refinement Checklist          | Markdown        | ❌ No           | Low      | Quality checklist for stories          |

### GitHub Projects Integration

- Story issue template with standard "As a... I want... so that..." format
- Links to parent chunks and technical tasks
- Story points and priority fields

---

## Phase 5: Sprint Planning with Test-Driven Design

### Templates Required

| Template Name                   | Type            | GitHub Projects | Priority | Purpose                               |
| ------------------------------- | --------------- | --------------- | -------- | ------------------------------------- |
| Sprint Milestone Template       | GitHub Template | ✅ **YES**      | **High** | Sprint tracking in GitHub Projects    |
| Sprint Planning Prompt Template | XML Prompt      | ❌ No           | High     | Claude automation for sprint creation |
| Sprint Planning Template        | Markdown        | ❌ No           | Medium   | Sprint planning documentation         |
| Test Specification Template     | Markdown        | ❌ No           | Medium   | TDD test planning                     |
| TDD Implementation Guide        | Markdown        | ❌ No           | Low      | Test-driven development guidance      |
| Context Loading Checklist       | Markdown        | ❌ No           | Medium   | Claude session preparation            |

### GitHub Projects Integration

- Sprint milestone templates
- Sprint board automation rules
- Test tracking integration

---

## Phase 6: Review & Retrospective

### Templates Required

| Template Name                       | Type            | GitHub Projects | Priority | Purpose                                 |
| ----------------------------------- | --------------- | --------------- | -------- | --------------------------------------- |
| Retrospective Issue Template        | GitHub Template | ⚠️ **Optional** | Low      | Track methodology improvements          |
| Execution Tracking Prompt Template  | XML Prompt      | ❌ No           | High     | Claude automation for progress tracking |
| Progress Tracking Template          | Markdown        | ❌ No           | Medium   | Session progress documentation          |
| Session Notes Template              | Markdown        | ❌ No           | Medium   | Development session records             |
| Context Refresh Checklist           | Markdown        | ❌ No           | Medium   | Stale context recovery                  |
| Feature Retrospective Template      | Markdown        | ❌ No           | Medium   | Feature completion review               |
| Monthly Methodology Review Template | Markdown        | ❌ No           | Low      | Process improvement tracking            |

### GitHub Projects Integration

- PR templates that auto-update story status
- Automated board movement rules
- Completion tracking

---

## Cross-Cutting Templates (All Phases)

### Templates Required

| Template Name                    | Type            | GitHub Projects | Priority | Purpose                          |
| -------------------------------- | --------------- | --------------- | -------- | -------------------------------- |
| Bug Report Template              | GitHub Template | ⚠️ **Optional** | Medium   | Defect tracking during execution |
| Technical Spike Template         | GitHub Template | ⚠️ **Optional** | Medium   | Research task tracking           |
| Context Loading Session Template | XML Prompt      | ❌ No           | High     | Universal Claude session startup |
| Story Context Template           | Markdown        | ❌ No           | High     | Context preservation for stories |

### GitHub Projects Integration

- Universal context status tracking
- Automated staleness detection
- Cross-phase issue linking

---

## Implementation Priority

### **Priority 1: Core GitHub Projects Templates (Create First)**

1. **Feature Epic Template** - Foundation for all features
2. **User Story Template** - Core development tracking
3. **Chunk Issue Template** - Technical organization
4. **Sprint Milestone Template** - Execution tracking

### **Priority 2: Essential XML Prompts**

5. **Feature Planning Prompt** - PRD automation
6. **User Story Creation Prompt** - Story automation
7. **Context Loading Session Prompt** - Claude optimization

### **Priority 3: Supporting Templates**

8. **Bug Report Template** - Quality tracking
9. **Technical Spike Template** - Research tracking
10. **Progress Tracking Template** - Session management

### **Priority 4: Optimization Templates**

- All remaining Markdown templates for process refinement
- Additional XML prompts for advanced automation

---

## Template Summary

| Category                      | Count  | GitHub Projects  | Purpose                               |
| ----------------------------- | ------ | ---------------- | ------------------------------------- |
| **GitHub Projects Templates** | **7**  | ✅ YES           | Issue tracking and project management |
| **XML Prompt Templates**      | **7**  | ❌ No            | Claude Code automation                |
| **Markdown Templates**        | **9**  | ❌ No            | Context and planning documentation    |
| **Total Templates**           | **23** | **7 for GitHub** | Complete AAFD implementation          |

## Next Steps

1. **Create Priority 1 GitHub Templates** - Set up core project structure
2. **Implement XML Prompt Library** - Enable Claude automation
3. **Establish Context Management** - Create Markdown templates
4. **Configure GitHub Projects** - Set up custom fields and automation
5. **Test with Pilot Feature** - Validate template effectiveness

---

_Last Updated: 2025-06-17_
_Methodology Version: AAFD v2.0_
