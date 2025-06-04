# Role-Based Context Priming Implementation

## 1. Create Role Directory Structure

```
.claude/
├── roles/                  # Role-based commands
│   ├── ui-engineer.md
│   ├── data-engineer.md
│   ├── ai-engineer.md
│   ├── architecture-engineer.md
│   ├── security-engineer.md
│   └── cms-engineer.md
├── docs/                   # Organized by domain
│   ├── ui/
│   │   ├── component-patterns.md
│   │   ├── tailwind-standards.md
│   │   └── accessibility-requirements.md
│   ├── data/
│   │   ├── supabase-patterns.md
│   │   ├── react-query-patterns.md
│   │   └── database-schema.md
│   ├── ai/
│   │   ├── portkey-integration.md
│   │   ├── prompt-engineering.md
│   │   └── model-selection.md
│   └── ...
└── core/                   # Core shared context
    ├── project-overview.md
    ├── code-standards.md
    └── development-workflow.md
```

## 2. Create Core Context Documents

Start with these essential shared documents:

1. `core/project-overview.md` - High-level project description
2. `core/code-standards.md` - Universal code quality standards
3. `core/development-workflow.md` - Development process and workflow

## 3. Create Role-Specific Context Documents

For each meta role, create specialized context documents:

### UI Engineer
- `ui/component-patterns.md`
- `ui/tailwind-standards.md`
- `ui/accessibility-requirements.md`
- `ui/responsive-design.md`

### Data Engineer
- `data/supabase-patterns.md`
- `data/react-query-patterns.md`
- `data/database-schema.md`
- `data/migration-patterns.md`

### AI Engineer
- `ai/portkey-integration.md`
- `ai/prompt-engineering.md`
- `ai/model-selection.md`
- `ai/response-handling.md`

## 4. Create Role Command Files

For each meta role, create a command file that:
1. Loads relevant context documents
2. Sets the appropriate mental model
3. Provides role-specific examples from the codebase

## 5. Create Task-Specific Commands

For common tasks within each role, create specialized commands:

```
.claude/
├── tasks/                  # Task-specific commands
│   ├── ui/
│   │   ├── new-component.md
│   │   ├── page-layout.md
│   │   └── responsive-design.md
│   ├── data/
│   │   ├── new-table.md
│   │   ├── query-optimization.md
│   │   └── migration.md
│   └── ...
```

## 6. Document Usage in README

Add a section to README.md explaining:
- Available meta roles and when to use each
- How to switch between roles
- How to combine roles for complex tasks

Here's a sample section to add to your README.md:

```markdown
## Role-Based Context Priming

This project uses Claude's context priming capabilities to provide specialized assistance based on different engineering roles. This helps Claude understand your codebase better and provide more relevant assistance.

### Available Roles

- **UI Engineer** (`/read .claude/roles/ui-engineer.md`): Frontend implementation, component design, user experience
- **Data Engineer** (`/read .claude/roles/data-engineer.md`): Database design, data access patterns, authentication
- **AI Engineer** (`/read .claude/roles/ai-engineer.md`): AI integration, prompt engineering, model optimization
- **Architecture Engineer** (`/read .claude/roles/architecture-engineer.md`): System design, service integration
- **Security Engineer** (`/read .claude/roles/security-engineer.md`): Authentication, authorization, data protection
- **CMS Engineer** (`/read .claude/roles/cms-engineer.md`): Content management, editorial workflows
- **Unit Test Writer** (`/read .claude/roles/unit-test-writer.md`): Test implementation, mocking, test-driven development

### How to Use Roles

1. **Switch to a role** at the beginning of your session:
   ```
   /read .claude/roles/ui-engineer.md
   ```

2. **Ask role-specific questions** after loading a role:
   ```
   Now that you're in UI Engineer role, help me implement a responsive navigation component.
   ```

3. **Combine roles** for complex tasks:
   ```
   /read .claude/roles/ui-engineer.md
   /read .claude/roles/data-engineer.md
   
   I need to create a data table component that fetches and displays user data from Supabase.
   ```

4. **Use task-specific commands** for common workflows:
   ```
   /read .claude/tasks/ui/new-component.md
   
   I need a Button component with primary, secondary, and danger variants.
   ```

### Best Practices

- Load the most relevant role for your current task
- Be specific about what you're trying to accomplish
- For complex tasks spanning multiple domains, load the most relevant roles in order of importance
- If Claude seems to be missing context, try loading additional relevant documentation
```

This documentation provides clear instructions on:
1. What roles are available and their purposes
2. How to activate a specific role
3. How to ask questions after loading a role
4. How to combine multiple roles for complex tasks
5. How to use task-specific commands
6. Best practices for effective role-based interactions
