# ClaudeKit integration

I want to integrate ClaudeKit (https://github.com/carlrannaberg/claudekit) into my project.

## Requirements

### Retain existing .claude directory, commands and files
The project currently has an existing .claude directory with a number of commands and files. I want to retain these when we integrate Claude Code

### Retain existing /codecheck setup
The project has been setup to use a linter (Biome) and other formatting utilities (see package.json). I do not want these changed. I want to use the same packages and pnpm scripts. We need to adapt ClaudeKit to use the existing utilities and pnpm scripts.

###

## Your task
1. Fetch https://github.com/carlrannaberg/claudekit and review the codebase.
2. Identify additional areas within the current project codebase that might be impacted by the integration.
3. I want you to evaluate ClaudeKit and identify different options for integrating it into the project.
4. Evalue your integration options.
5. Make a recommendation for how to integrate ClaudeKit into the project.