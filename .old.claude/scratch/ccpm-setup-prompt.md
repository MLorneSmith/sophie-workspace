# CCPM integration

I want to integrate CCPM (<https://github.com/automazeio/ccpm>) into my project.

We have evlauted CCPM's fit with our existing codebase here: reports/FEATURE_CCPM_INTEGRATION_ANALYSIS.md. The conclusion is that while we have excellent technical capabilities (agents, hooks, commands), CCPM would provide missing **strategic project management** and **parallel execution orchestration** layers.

## Requirements

### Retain existing .claude directory, commands and files

My project currently has an existing .claude directory with many commands and files. I want to retain these when we integrate CCPM

### Cherry pick CCPM features

I want to integrate select features of CCPM, not the entire system. We will need to identify the specific commands, agents and code we want to integrate

### PRD & Epic terminology

I find the CCPM terminology of PRDs and Epics confusing. I would like to change these terms. I will need suggestions.

### Stengths of CCPM that I like

- GitHub issues as persistent context
- No context compaction needed (GitHub handles persistence)
- Direct issue updates for progress tracking

###

## Your task

1. Read reports/FEATURE_CCPM_INTEGRATION_ANALYSIS.md
2. Fetch <https://github.com/automazeio/ccpm> and review codebase
3. Identify the specific features that we should target for integration with our project
4. Identify areas within the current project codebase that might be impacted by the integration.
5. I want you to evaluate CCPM and identify different options for integrating it into the project.
6. Evaluate your integration options.
7. Make a recommendation on how to integrate CCPM into the project.
