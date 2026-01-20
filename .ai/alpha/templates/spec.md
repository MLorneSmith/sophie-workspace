```markdown
  # Project Specification: [Project Name]

  ## Metadata
  | Field | Value |
  |-------|-------|
  | **Spec ID** | S[spec-#] |
  | **GitHub Issue** | #[spec-#] |
  | **Document Owner** | [Name] |
  | **Created** | [Date] |
  | **Status** | Draft |
  | **Version** | 0.1 |

  ---

  ## 1. Executive Summary

  ### One-Line Description
  [Single sentence: What is this project?]

  ### Press Release Headline
  [If we announced this, what would the headline be?]
  > "[COMPANY] announces [PRODUCT] enabling [CUSTOMER] to [BENEFIT]"

  ### Elevator Pitch (30 seconds)
  [2-3 sentences explaining the project to a non-technical stakeholder]

  ---

  ## 2. Problem Statement

  ### Problem Description
  [What problem exists in the world today?]

  ### Who Experiences This Problem?
  [Which users/personas feel this pain most acutely?]

  ### Current Alternatives
  [How do people solve this today? What are the gaps?]

  ### Impact of Not Solving
  [What happens if we don't build this?]
  - Business impact:
  - User impact:
  - Competitive impact:

  ---

  ## 3. Vision & Goals

  ### Product Vision
  [What does the ideal end-state look like? Think 1-2 years out.]

  ### Primary Goals (SMART)

  > **⚠️ REQUIRED**: Each goal MUST include a specific percentage or number target.
  > BAD: "Increase user engagement"
  > GOOD: "Increase /home page views by 40% vs current baseline (500/week)"

  | Goal | Success Metric | Target | Measurement Method |
  |------|---------------|--------|-------------------|
  | G1: [Goal] | [Metric] | [+X% or specific number] | [How measured] |
  | G2: [Goal] | [Metric] | [+X% or specific number] | [How measured] |
  | G3: [Goal] | [Metric] | [+X% or specific number] | [How measured] |

  ### Strategic Alignment
  [How does this connect to broader company/product strategy?]

  ---

  ## 4. Target Users

  ### Primary Persona
  **Name**: [Persona name]
  **Role**: [Job title/description]
  **Goals**: [What they're trying to accomplish]
  **Pain Points**: [Current frustrations]
  **Quote**: "[Hypothetical quote capturing their need]"

  ### Secondary Personas
  [List 1-2 additional personas with brief descriptions]

  ### Anti-Personas (Who This Is NOT For)
  [Explicitly list users we are NOT targeting]

  ---

  ## 5. Solution Overview

  ### Proposed Solution
  [High-level description of what we're building]

  ### Key Capabilities
  [Bulleted list of major capabilities - these become initiative candidates]

  1. **[Capability 1]**: [Brief description]
  2. **[Capability 2]**: [Brief description]
  3. **[Capability 3]**: [Brief description]

  ### Customer Journey
  [Narrative of how a user experiences the solution end-to-end]

  1. User discovers/accesses the solution
  2. User completes primary workflow
  3. User achieves desired outcome
  4. User returns/continues engagement

  ### Hypothetical Customer Quote
  > "[What would a delighted user say after using this?]"
  > — [Persona name], [Role]

  ### Responsive Behavior (if UI feature)

  > **Note**: Skip this section for backend-only features.

  | Breakpoint | Layout | Notes |
  |------------|--------|-------|
  | Mobile (<768px) | [Single column / stacked] | [Key adaptations] |
  | Tablet (768-1024px) | [2-column / adjusted] | [Key adaptations] |
  | Desktop (>1024px) | [Full layout] | [Primary design target] |

  ---

  ## 6. Scope Definition

  ### In Scope
  [Explicit list of what IS included]

  - [ ] [Scope item 1]
  - [ ] [Scope item 2]
  - [ ] [Scope item 3]

  ### Out of Scope
  [Explicit list of what is NOT included - critical for avoiding scope creep]

  - [ ] [Excluded item 1]
  - [ ] [Excluded item 2]
  - [ ] [Excluded item 3]

  ### Future Considerations (v2+)
  [Ideas explicitly deferred to future versions]

  ---

  ## 7. Technical Context

  > **⚠️ NO TBD ITEMS ALLOWED**: If you don't know a technical detail, either:
  > 1. Conduct research to find out (use alpha-context7 or code-explorer)
  > 2. Document it as an Open Question with a spike task
  > 3. Mark it explicitly as "Requires Spike: [specific question]"
  >
  > Do NOT write "TBD" - this delays unknowns rather than addressing them.

  ### System Integration Points
  [What existing systems does this interact with? Use EXACT table/file names from codebase exploration.]

  | System | Integration Type | Notes |
  |--------|-----------------|-------|
  | [Exact table/system name] | [API/DB/Event] | [Specific details - no TBD!] |

  ### Technical Constraints
  [Non-negotiable technical requirements]

  - **Performance**: [Requirements]
  - **Security**: [Requirements]
  - **Compliance**: [Requirements]
  - **Scalability**: [Requirements]

  ### Technology Preferences/Mandates
  [Any required or preferred technologies]

  ### Dependencies
  [External dependencies that could block progress]

  | Dependency | Owner | Risk Level | Notes |
  |------------|-------|------------|-------|
  | [Dep 1] | [Team] | High/Med/Low | [Details] |

  ---

  ## 8. Assumptions & Risks

  ### Key Assumptions
  [Things we're assuming to be true - if wrong, project may fail]

  1. **[Assumption 1]**: [Description] — *Validation: [How to verify]*
  2. **[Assumption 2]**: [Description] — *Validation: [How to verify]*

  ### Risk Register

  | ID | Risk | Probability | Impact | Mitigation | Owner |
  |----|------|-------------|--------|------------|-------|
  | R1 | [Risk description] | H/M/L | H/M/L | [Strategy] | [Name] |
  | R2 | [Risk description] | H/M/L | H/M/L | [Strategy] | [Name] |

  ### Open Questions
  [Unresolved questions that need answers before/during development]

  1. [ ] [Question 1]
  2. [ ] [Question 2]

  ---

  ## 9. Success Criteria

  ### Definition of Done (Project Level)
  [When is this project "complete"?]

  - [ ] [Criterion 1]
  - [ ] [Criterion 2]
  - [ ] [Criterion 3]

  ### Launch Criteria
  [What must be true before we can launch?]

  ### Post-Launch Validation
  [How will we know if this succeeded after launch?]

  | Metric | Baseline | Target | Timeframe |
  |--------|----------|--------|-----------|
  | [Metric 1] | [Current] | [Goal] | [When measured] |

  ---

  ## 10. Decomposition Hints

  > **Note**: This section provides guidance for the next phase (initiative/feature decomposition).

  ### Standard Initiative Categories to Consider

  Always evaluate whether these initiative types apply:

  1. **Foundation/Layout** (P0) - Page structure, grid, routing, shell components
  2. **Data Layer** (P0/P1) - Loaders, caching, parallel fetching, type definitions
  3. **Core Components** - Main feature widgets/components that deliver value
  4. **Integrations** - External APIs, third-party services (often higher risk)
  5. **Polish & Edge Cases** - Empty states, loading states, error handling, accessibility

  ### Candidate Initiatives
  [High-level groupings of work - typically 3-7 major initiatives. Map to Key Capabilities.]

  1. **[Initiative Name]**: [Brief description, maps to Key Capability 1]
  2. **[Initiative Name]**: [Brief description, maps to Key Capability 2]

  ### Suggested Priority Order
  [Recommended sequencing based on dependencies and value]

  > **Rule**: Foundation and Data Layer are almost always P0. External integrations are usually P2 (higher risk, can be parallel).

  ### Complexity Indicators
  | Area | Complexity | Rationale (based on codebase findings) |
  |------|------------|----------------------------------------|
  | [Area 1] | High/Med/Low | [Cite specific findings from exploration] |

  ---

  ## 11. Appendices

  ### A. Glossary
  [Define domain-specific terms]

  ### B. Codebase Exploration Results (REQUIRED)

  > **⚠️ MANDATORY**: Document all reusable components with exact file paths.

  | Component/Pattern Found | File Path | Reusable? | Notes |
  |------------------------|-----------|-----------|-------|
  | [Component name] | [Exact path from codebase] | Yes/Pattern only | [How to reuse] |

  **Tables/Schemas Identified:**
  | Table Name | Location | Purpose |
  |------------|----------|---------|
  | [table_name] | [migration file or schema] | [How it relates to this spec] |

  ### C. Research Integration (REQUIRED)

  > **⚠️ MANDATORY**: Document how research findings influenced this spec.

  | Research File | Key Findings | Spec Section(s) Affected |
  |--------------|--------------|-------------------------|
  | [filename.md] | [3-5 bullet findings] | [Section numbers] |

  ### D. External References
  [Links to user research, competitor analysis, external API docs]

  ### E. Visual Assets

  > **⚠️ REQUIRED for UI features**: Include ASCII layout mockup showing component arrangement.
  > Skip this section for backend-only features.

  **ASCII Layout Mockup:**
  ```
  ┌──────────────────────────────────────────────────────────────┐
  │                        [Page Title]                            │
  ├─────────────────┬─────────────────┬────────────────────────────┤
  │ [Component 1]   │ [Component 2]   │ [Component 3]              │
  │ - Sample data   │ - Sample data   │ - Sample data              │
  ├─────────────────┴─────────────────┴────────────────────────────┤
  │ [Full-width Component]                                         │
  └──────────────────────────────────────────────────────────────┘
  ```

  **Mockup Requirements:**
  - Component names MUST match Key Capabilities (Section 5)
  - Sample content shows what each component displays
  - Tables show column structure
  - Layout matches grid description

  **Additional Assets:**
  - [Link to Figma/design files if available]
  - [Link to wireframes if available]

  ### F. Decision Log
  | Date | Decision | Rationale | Decided By |
  |------|----------|-----------|------------|
  | [Date] | [Decision] | [Why] | [Who] |


