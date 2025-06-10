We have an existing workflow for debugging issues with Claude Code. We want to augment it.

## Existing workflow

1. **log-issue command**: .claude/commands/log-issue.md
2. **debug-issue command**: .claude/commands/debug-issue.md

This flow works well. But for more complex issues, we need to break our the debug-issue command into 3, more systematic steps.

## Examples

Read the following three files for inspiration

.claude/prompt-snippets/parker-rex-1-debug-instructions.md
.claude/prompt-snippets/parker-rex-2-debug-instruction.md
.claude/prompt-snippets/parker-rex-3-debug-instruction.md

## Goal

We want to keep the existing workflow for simple issues. But for complex issues, we want to create am alternative, three step deep-debug workflow.

## Additional requirements

1. We want to be more explicit in reminding Claude Code to use certain tools in the right circumstances
   a. We now have the ability to access new relic data via an mcp. We want to be more explicit in reminding Claude Code to use it when appropriate
   b. We want to be more explicit in reminding Claude Code to use the cloudflare playwright tools when appropriate
   c. We want to be more explicit in reminding Claude Code to use the browser tools mcp server when appropriate
2. We want to include a research step in the deep-debug workflow
   a. We want to be more explicit in reminding Claude Code to use the context7 research tool when appropriate
3. We want to include a step for Claude Code to analyze whether issues can be clustered together
   a. We want to be more explicit in reminding Claude Code to use the issue clustering tool when appropriate
4. I am not convinced the 'parker-rex' examples above use the right role titles. We have developed a first pass at a 'quality assurance and testing engineer' role. We should use that role for the deep-debug workflow. But we can also refine and improve that role description.
   a Read .claude/roles/qa-testing-engineer.md
   b. suggest any additional roles for the other steps in the workflow

## Updating GitHub Issue

1. We want to be sure to be updating the github issue at each step in the workflow.
2. We need a system that will allow us to pickup where we left off with the next step

Ultrathink through our requirements and a proposed 3-step workflow. Identify any missing tools that we may want to work to provide claude access to.
