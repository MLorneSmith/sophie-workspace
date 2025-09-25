# Code Standards

## TypeScript

### Type Safety

- **Never use `any` type** - Use `Record<string, unknown>`, generics, or proper interfaces instead
- **Avoid `unknown`** unless absolutely necessary for type narrowing
- Define interfaces for all data structures
- Use type guards for runtime type checking
- Prefer `type` over `interface` for consistency
- Use Zod for runtime validation

### Null Safety

- **Always check for null/undefined** before accessing properties
- Use optional chaining (`?.`) for safe property access
- Use nullish coalescing (`??`) for default values
- Avoid non-null assertions (`!`) - Use proper null checks instead
- Type all nullable values explicitly (e.g., `string | null`)

### Type Exports and Imports

- Export all types used across packages from package index files
- Use `import type` for type-only imports to improve tree-shaking
- Ensure package.json exports field includes all public types
- Keep type definitions close to their implementation

### Discriminated Unions

- Use proper discriminated unions for action results and similar patterns
- Include a discriminator field (e.g., `success: boolean`, `type: string`)
- Ensure all union cases are handled in switch statements
- Example:

  ```typescript
  type ActionResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };
  ```

### React 19 Compatibility

- Use `React.ReactNode` for component children, not `React.ReactElement`
- Align React versions across all packages in the monorepo
- Update component prop types to match React 19 standards
- Avoid mixing React type versions between packages

## React

- Prefer functional components
- Use hooks for state and side effects
- Destructure props for clarity
- Add JSDoc comments to components and functions
- Use named exports for components

## Next.js

- Prefer Server Components when possible
- Use Client Components only when needed (interactivity)
- Follow App Router patterns for routing and layouts
- Use metadata API for SEO
- Use Server Actions for form submissions

## Styling

- Use Tailwind CSS for styling
- Follow utility-first approach
- Use shadcn/ui components when available
- Maintain consistent spacing and sizing
- Use CSS variables for theming

## File Structure

- Group files by feature, not by type
- Keep related files close together
- Use index files for cleaner imports
- Follow consistent naming conventions
- Keep files focused on a single responsibility

## Biome Linting Standards

### Import Management

- Remove all unused imports immediately
- Use `import type` for type-only imports
- Order imports consistently (built-in, external, internal, relative)
- Avoid circular dependencies between packages

### Variable and Parameter Usage

- Remove unused variables and parameters
- If a parameter must be kept for interface compatibility, prefix with `_`
- Clean up unused function returns
- Remove dead code and unreachable statements

### Code Quality

- **No suppression comments** without documentation
- Fix linting issues rather than suppressing them
- Use proper ESLint disable comments only when absolutely necessary
- Document why any suppression is required

### Array Operations

- **Never use array index as React key** - Use stable, unique identifiers
- Generate proper keys using data properties or UUIDs
- Avoid index-based keys even in static lists

### Formatting

- Run `pnpm biome format --write` before committing
- Maintain consistent indentation (2 spaces)
- Keep line length reasonable (< 100 chars for readability)
- Use consistent quote style (single quotes)

## Testing Standards

### Type-Safe Testing

- **Never use `as any` in tests** - Create proper mock types instead
- Define complete mock objects that satisfy interfaces
- Use helper functions to create type-safe test data
- Example:

  ```typescript
  // Bad
  const mockUser = { id: 1 } as any;

  // Good
  const createMockUser = (overrides?: Partial<User>): User => ({
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    ...overrides,
  });
  ```

### Mock Patterns

- Create reusable mock factories for common types
- Use partial mocks only with proper type assertions
- Maintain mock data in separate test utilities
- Keep mocks close to their interface definitions

### Test Dependencies

- Ensure all test dependencies are properly installed
- Use consistent versions of testing libraries
- Document any special test setup requirements
- Keep test utilities in shared packages

## Error Prevention

### Build Process

- Run `pnpm typecheck` before committing any TypeScript changes
- Run `pnpm lint` to catch Biome issues early
- Fix all errors before pushing code
- Use pre-commit hooks to enforce standards

### Memory Management

- Be aware of memory limits during large compilations
- Split large build tasks if memory errors occur
- Use `NODE_OPTIONS="--max-old-space-size=8192"` for intensive builds
- Monitor for circular dependencies that can cause memory issues

### Continuous Integration

- All PRs must pass TypeScript compilation
- All PRs must pass Biome linting
- No merging with type errors or linting violations
- Set up branch protection rules to enforce standards
