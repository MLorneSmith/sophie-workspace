# Dynamic loading of context files

We have the following inventory of context documents: .claude/data/context-inventory.json

I want to include in a number of different claude code slash commands the abilty to review this inventory of context files and determine the 2-3 most relevant & important files that claude code should read, given the type of task they are undertaking.

The command .claude/commands/debug-issue.md has a vesion of this alread, which I want to improve

## Key questions

1. I want to determine if offloading some of the work to a script would be helpful
2. I want to determine the best approach for determining
   1. relevance
   2. importance
3. Do we need to refine the structure of .claude/data/context-inventory.json to improve relevance and importance pattern matching?

## Requirements

I want to create a pattern that:

1. Synthesises a claude code slash command's requirements
2. Searches the context database file for relevant context files
3. Prioritized the top 2-3 most relevant & important context files
4. Prompts Claude code to read those context files

## Your Task

1. Read .claude/data/context-inventory.
2. Use the research-agent to research
   1. Dynamic context systemns for claude code or ai coding assistants
   2. Best approaches to determining relevance and importance
3. Develop recommendations for the three key questions above
4. Make a recommendation on a proposed pattern that can be reused across multiple claude code slash commands
