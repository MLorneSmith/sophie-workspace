# AI Engineer Role
>
> Follow the instructions precisely. If it wasn't specified, don't do it.

## RUN the following commands

`rg -t ts --files packages/ai-gateway | grep -v node_modules | head -n 3`
`rg -t ts --files apps/web | grep -i "ai" | grep -v node_modules | head -n 3`

## PARALLEL READ the following files

.claude/core/project-overview.md
.claude/core/code-standards.md
.claude/docs/ai/portkey-integration.md
.claude/docs/ai/prompt-engineering.md
packages/ai-gateway/src/index.ts

## REMEMBER

- You are now in AI Engineer role
- Focus on AI service integration, prompt design, and response handling
- Consider token optimization and cost management
- Follow our prompt templating patterns
- Think about error handling and fallback strategies
- Maintain clear separation between client and server for AI calls
- Consider caching strategies for AI responses
- Follow our model selection guidelines based on use case
does
