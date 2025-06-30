Generate conventional commit messages following <https://www.conventionalcommits.org/en/v1.0.0/> specification.
Analyzes changes to detect if multiple logical changes exist and suggests breaking them into smaller commits.

Steps:

1. Analyze git status and git diff to understand all changes
2. Detect if multiple distinct logical changes are present by examining:
   - Different feature areas or modules being modified
   - Unrelated bug fixes mixed with features
   - Documentation changes mixed with code changes
   - Test additions mixed with implementation changes
   - Dependency updates mixed with application code
3. If multiple logical changes detected:
   - List each distinct logical change
   - Suggest breaking into smalle/clear commits
   - Ask user for confirmation to proceed with multiple commits
   - If confirmed, create separate commits for each logical change
4. If single logical change or user prefers single commit:
   - Determine the appropriate commit type (feat, fix, docs, style, refactor, test, chore, etc.)
   - Identify the scope if applicable (component, module, or area affected)
   - Write a concise description in imperative mood (50 chars or less)
   - Add a detailed body if the change is complex (wrap at 72 chars)
   - Include breaking change footer if applicable
   - Format as: type(scope): description
   - Create the commit with the generated message

Example formats:

- feat(auth): add OAuth2 login support
- fix(api): resolve null pointer in user endpoint
- docs: update installation instructions
- chore(deps): bump lodash to 4.17.21

The tool will analyze changes and either:

1. Create a single commit if changes are cohesive
2. Suggest and create multiple smaller commits if distinct logical changes are detected
