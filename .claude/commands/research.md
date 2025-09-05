---
description: Conduct comprehensive research on any topic using specialized research agent
argument-hint: "<question or topic to research>"
allowed-tools: Task
category: workflow
---

# Research Command

Conduct in-depth research on the specified topic using advanced search capabilities.

## Research Query
$ARGUMENTS

## Execution

Delegate to the specialized research agent for comprehensive investigation:

```
Task Tool:
- description: "Research: $ARGUMENTS"
- subagent_type: "research-agent"
- prompt: "Conduct research on: $ARGUMENTS

Classify the query complexity (SIMPLE FACTUAL, FOCUSED INVESTIGATION, or COMPREHENSIVE RESEARCH) and execute appropriate research depth.

For comprehensive research:
- Use parallel search execution across multiple platforms
- Save detailed reports to /reports/ directory if output exceeds 500 lines
- Provide executive summary directly

Leverage all available research tools (Exa, Perplexity, Context7, WebSearch) to gather comprehensive information."
```

The research agent will:
1. Classify query complexity
2. Execute parallel searches across multiple platforms  
3. Cross-reference and synthesize findings
4. Deliver structured report with citations
5. Save extensive reports to `/reports/` when appropriate

## Benefits of Agent Delegation

- **Specialized expertise**: Research agent has optimized search strategies
- **Context preservation**: Agent approach manages large research outputs efficiently
- **Advanced tools**: Access to Exa, Perplexity, Context7 for comprehensive coverage
- **Parallel execution**: 3-5x faster through simultaneous searches