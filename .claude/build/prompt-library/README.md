# Prompt Library

## Overview

The prompt library contains XML-structured prompts for consistent AI interactions throughout the development process. All prompts follow the Parker Rex pattern for maximum effectiveness.

## Available Prompts

### Core Development Prompts

- `feature-planning.xml` - Convert feature ideas into structured PRDs
- `implementation-planning.xml` - Break PRDs into implementable stories
- `session-loading.xml` - Load complete context for development sessions

### Specialized Prompts

- `story-estimation.xml` - Estimate story complexity and effort
- `technical-analysis.xml` - Analyze technical requirements and constraints
- `retrospective.xml` - Conduct feature and process retrospectives

## Prompt Structure

All prompts follow this XML structure:

```xml
<prompt>
  <task>Brief description of what the prompt accomplishes</task>

  <context>
    <project_info>{PROJECT_CONTEXT}</project_info>
    <codebase_patterns>{EXISTING_PATTERNS}</codebase_patterns>
    <technical_constraints>{CONSTRAINTS}</technical_constraints>
  </context>

  <instructions>
    <step number="1">
      <title>Step Title</title>
      <description>Detailed description</description>
    </step>
  </instructions>

  <input>
    <!-- Input parameters -->
  </input>

  <output_format>
    <!-- Structured output specification -->
  </output_format>
</prompt>
```

## Usage Guidelines

1. **Read Full Prompt**: Always read the complete prompt template
2. **Customize Context**: Update project-specific information
3. **Provide Required Inputs**: Fill in all input parameters
4. **Follow Output Format**: Use the specified output structure
5. **Document Results**: Save outputs in appropriate context files

## Customization

Prompts should be customized for SlideHeroes:

- Update `project_info` with current tech stack
- Include relevant `codebase_patterns`
- Reference specific `technical_constraints`
- Add SlideHeroes-specific examples
