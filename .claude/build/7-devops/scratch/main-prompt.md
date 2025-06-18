## Context

We are implementing a new methodology for building features with Claude Code.

- Read: .claude/build/8-devops/methodology-design.md.

Our full process is summarized here:

- read .claude/build/8-devops/process-summary.md

We have an orchestration command that manages the full process: read .claude/commands/build-feature.md

We have prompts for each stage of the process.

- .claude/build/1-process/0-user-discovery/user-discovery-prompt.xml
- .claude/build/1-process/1-idea-to-prd/idea-to-prd-prompt.xml,
- .claude/build/1-process/2-prd-chunking/create-prd-chunks-prompt.xml,
- .claude/build/1-process/2-prd-chunking/validate-prd-chunks.xml,
- .claude/build/1-process/3-stakeholder-validation/stakeholder-validation-prompt.xml,
- .claude/build/1-process/4-user-stories-creation/create-user-stories-prompt.xml,
- .claude/build/1-process/5-sprint-planning/create-sprints-prompt.xml,
- .claude/build/1-process/6-sprint-execution/execution-tracking-prompt.xml,
- .claude/build/1-process/6-sprint-execution/implementation-prompt.xml and
- .claude/build/1-process/6-sprint-execution/master-execution-prompt.xml.

We have a set of 'agent' roles defined. Read all of them:

- .claude/build/0-agents/1-planner.xml,
- .claude/build/0-agents/2-builder.xml,
- .claude/build/0-agents/3-reviewer.xml,
- .claude/build/0-agents/4-fixer.xml,
- .claude/build/0-agents/5-product-owner.xml and
- .claude/build/0-agents/6-critic.xml.

# My Questions

1. We have a set of templates .claude/build/1-process/0-user-discovery/templates for stage 0 user discovery phase. Are there
