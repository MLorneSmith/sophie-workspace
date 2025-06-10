# Goal

I want to design a system / methodology for building new app features with Claude Code.

## Current Situation

I am a novice, solo developer.

## Potential Develop liffecycle approaches

Should we adopt a SCRUM approach, waterfall, kanban, or something else? What are the pros and cons of each? What are the key differences between them? Every approach has its own set of ceremonies and artifacts. How can we distill the best of each into a lean, effective workflow? Evaluate each approach based on its suitability for a small, solo developer working with an AI coding assistant like claude code.

## Patterns that are currently working with Claude Code

When working with Claude Code we are having success with the following patterns:

1. We are using roles to provide context for Claude Code: .claude/roles
2. We are using orchestration scripts to manage complex, multi-step processes. e.g. .claude/commands/deep-debug.md
3. We are using commands to trigger workflows. e.g. .claude/commands/debug-issue.md

### Additional patterns we could be better at

1. I think we could be better at using Templates to provide structure for our output

## Development Lifecycle

It feels to me that we have to thoughtfully break down the steps of planning, designing and building a new feature into the approprioate steps. Then design a workflow for each step and an orchestrator command to manage the flow between them.

Parker Rex provides a model for the development lifecycle. Read .claude/prompt-snippets/parker-rex-development-lifecycle.md for inspiration. But this model includes steps that are well beyond implementing a feature

## Current commands and workflows

### Current command

We have .claude/commands/build-feature.md currently, as a starting point.

We have the following 'template': .claude/specs/features/template/feature-spec-template.md

### Current 'specs setup'

See the files in .claude/specs

### Current Templates

See .claude/specs/features/template/feature-spec-template.md

## Implementation Tracking

I'd like to explore how we can use Github projects to track the implementation of a feature.

## Next Step

Ultrathink through the following questions:

1.  What is the right development lifecycle for building a feature?
2.  What are the appropriate steps within the feature development lifecycle that we should include in our workflow?
3.  How can we use Claude Code to manage the workflow for building a feature?
4.  How can we use templates to provide structure for our output?
5.  What are the appropriate prompts and commands for each step?
6.  What are the appropriate roles for each step?
7.  What are the appropriate tools for each step?
8.  How can we ensure that the output of each step is of high quality?
9.  How can we ensure that the workflow is efficient, effective and manages context well?
10. How can we use Github projects to track the implementation of a feature?

## Decisions

We have concoluded the following:
