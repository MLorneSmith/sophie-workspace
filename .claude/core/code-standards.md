# Code Standards

## TypeScript

- Use explicit typing (avoid `any` and `unknown`)
- Define interfaces for all data structures
- Use type guards for runtime type checking
- Prefer `type` over `interface` for consistency
- Use Zod for runtime validation

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
