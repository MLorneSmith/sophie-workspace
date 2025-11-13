Coding prompt best practices:

- Always use XML.
- Potential XML tags:
  - <context> - For background information or file references
  - <role> - the persona claude code should adopt
  - <instructions> - Core task description
  - <example> - Demonstration of expected output
  - <thinking> - For chain-of-thought reasoning
  - <execution_tips> - additional tips for performing the command
  - <examples> - examples of executing the command
  - <output_format> - Specific output format requirements
- Always start command with front matter enclosed in triple dashes
  - Include in frontmatter: Allowed tools, disallowed tools, description, model
- Where appropriate,, make command interactive with user
  - Some commands would benefit from a section where Claude code is prompted to ask the user two clarifying questions

- Where appropriate, use dynamic arguments:
  - Use $ARGUMENTS to capture the entire argument string ﻿Anthropic
  - Use $1, $2, etc., for positional arguments with default values ﻿Anthropic
    File Integration:
  - Use @ prefix to embed file contents (e.g., @src/app.js) ﻿Anthropic
  - Use ! prefix for bash commands whose output is included in context
- Where appropriate, use multi step validation chains
  - <execution_steps>
        1. **Analysis Phase**: Read relevant files with @ prefix
        2. **Validation Phase**: Run !npm run lint and !npm run test
        3. **Implementation Phase**: Make incremental changes
        4. **Verification Phase**: Re-run tests after each change
        5. **Documentation Phase**: Update relevant docs

        After each phase, ask: "Should I proceed to the next step?"
        </execution_steps>

- Where appropriate, include error prevention and handling instructions
  - Common mistake prevention - Explicitly list frequent errors to avoid
  - Boundary conditions - Define edge cases and how to handle them
  - Consistency checks - Instructions to verify internal consistency
  - Source attribution requirements - When and how to cite information
-
- Where appropriate, use prompt chaining to improve performance: <https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/chain-prompts>
