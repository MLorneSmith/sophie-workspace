---
name: react-19
description: Guide to React 19.2 features and patterns for developing with the latest React release. Use when creating or refactoring React components to ensure modern patterns are followed. Covers the Activity component for state preservation, useEffectEvent hook for stable effect callbacks, Partial Pre-rendering for performance, and migration away from deprecated patterns. Essential for projects using React 19.2+ to write future-proof, performant code.
---

# React 19.2 Modern Patterns

## Overview

React 19.2 introduces significant new features and breaking changes that LLMs trained before 2025 are unaware of. This skill provides guidance on using React 19.2's new APIs, avoiding deprecated patterns, and following best practices for the SlideHeroes codebase.

## When to Use This Skill

Invoke this skill when:
- Creating new React components or pages
- Refactoring existing React code
- Implementing visibility/state management for tabs, modals, or multi-step forms
- Working with effects that have callback dependencies
- Optimizing page rendering performance
- Encountering ESLint v7 warnings about deprecated patterns
- Migrating from React 18 patterns

## Core Capabilities

This skill covers three primary React 19.2 features plus migration guidance:

### 1. The `<Activity>` Component

Control component visibility while preserving internal state. Use instead of conditional rendering when:
- Pre-rendering tabs/panels for instant navigation
- Preserving form state when temporarily hidden
- Building multi-step wizards that maintain step state
- Creating modal/drawer UIs with complex internal state

**Quick Example:**
```tsx
// Preserves state when switching tabs
<Activity mode={tab === 'profile' ? 'visible' : 'hidden'}>
  <ProfileTab />
</Activity>
<Activity mode={tab === 'settings' ? 'visible' : 'hidden'}>
  <SettingsTab />
</Activity>
```

**See:** `references/activity-component.md` for complete usage guide, decision trees, and migration patterns.

### 2. The `useEffectEvent` Hook

Create stable functions that access latest props/state without re-running effects. Use when:
- Effect callbacks change on every render (toast notifications, analytics)
- Working with server actions and callbacks (useFetcher patterns)
- Event listeners need access to latest state
- Eliminating unnecessary effect dependencies

**Quick Example:**
```tsx
function Form({ onSuccess }: Props) {
  const fetcher = useFetcher();

  // ✅ Stable function that always calls latest onSuccess
  const handleSuccess = useEffectEvent(() => {
    onSuccess?.();
    toast.success('Success!');
  });

  useEffect(() => {
    if (fetcher.data?.success) handleSuccess();
  }, [fetcher.data]); // Only depends on data, not callbacks
}
```

**See:** `references/useEffectEvent.md` for detailed patterns, common use cases, and server action integration.

### 3. Partial Pre-rendering (PPR)

Combine static and dynamic rendering in a single page. Use when:
- Page has both static layout and user-specific content
- Optimizing initial page load performance
- Building dashboards with real-time sections
- Creating marketing pages with personalized elements

**Quick Example:**
```tsx
export const experimental_ppr = true;

function Dashboard() {
  return (
    <>
      {/* Static: Pre-rendered at build time */}
      <DashboardNav />
      <Sidebar />

      {/* Dynamic: Rendered at request time */}
      <Suspense fallback={<ProjectsSkeleton />}>
        <ProjectsList />
      </Suspense>
    </>
  );
}
```

**See:** `references/partial-prerendering.md` for Next.js configuration, performance benefits, and implementation patterns.

### 4. Deprecated Patterns & Breaking Changes

React 19.2 and ESLint v7 prohibit several previously-allowed patterns:
- Setting state in `useEffect` based on props (use render-time updates)
- Reading/writing refs during render (use `useState` instead)
- Using `forwardRef` (ref is now a standard prop)
- Using `defaultProps` (use ES6 default parameters)
- Using `PropTypes` (use TypeScript)

**See:** `references/deprecated-patterns.md` for migration guide, refactoring patterns, and MakerKit-specific examples.

## Quick Reference

For rapid lookup during development, consult `references/quick-reference.md` which provides:
- Decision trees (when to use Activity vs conditional rendering)
- Common pattern examples
- Anti-patterns to avoid
- Migration cheatsheet
- Performance quick wins
- Testing considerations

## Workflow for New Components

When creating a new React component:

1. **Choose rendering strategy**
   - Static content only → Server Component
   - User-specific data → Server Component with Suspense
   - Interactive UI → Client Component
   - Mix of both → Enable PPR

2. **Implement visibility management**
   - Preserve state when hidden → `<Activity>`
   - Temporary content → Conditional rendering (`&&`)
   - Frequently toggled → `<Activity>`

3. **Handle effects properly**
   - Callback dependencies → `useEffectEvent`
   - True dependencies → Include in dependency array
   - Event listeners → `useEffectEvent` for handlers

4. **Avoid deprecated patterns**
   - No `forwardRef` → Use ref as prop
   - No `defaultProps` → Use ES6 defaults
   - No state in `useEffect` → Render-time updates
   - No ref reads in render → Use `useState`

## Resources

### references/

Detailed documentation loaded into context as needed:

- **`activity-component.md`** - Complete guide to `<Activity>` component with use cases, performance considerations, and decision trees
- **`useEffectEvent.md`** - Comprehensive `useEffectEvent` documentation with server action patterns and common gotchas
- **`partial-prerendering.md`** - PPR configuration, Next.js setup, performance benefits, and SlideHeroes use cases
- **`deprecated-patterns.md`** - Breaking changes, migration patterns, ESLint v7 updates, and MakerKit refactoring examples
- **`quick-reference.md`** - Cheat sheet with decision trees, common patterns, anti-patterns, and testing examples

**Usage Note:** Reference files are loaded on-demand when working with specific features. Read the appropriate file based on the task at hand rather than loading all references upfront.

## SlideHeroes-Specific Patterns

The project uses React 19.2 patterns throughout:

1. **Server Actions with Callbacks** - Use `useEffectEvent` for toast notifications and redirects after form submissions
2. **Multi-tab Interfaces** - Use `<Activity>` for account settings, project dashboards, and configuration pages
3. **Performance Optimization** - Enable PPR on mixed static/dynamic pages (dashboards, AI canvas, pricing)
4. **Form State Management** - Combine `useActionState` with `useEffectEvent` for clean server action integration

## Integration with MakerKit Patterns

This skill complements existing MakerKit/SlideHeroes patterns:

- **Data Fetching**: Server Components with loaders (existing) + PPR (new)
- **Mutations**: Server actions (existing) + `useEffectEvent` for callbacks (new)
- **UI State**: React Hook Form (existing) + `<Activity>` for multi-step forms (new)
- **Authorization**: RLS policies (existing) + Server Components (new) = automatic access control

## Best Practices Summary

1. **Prefer `<Activity>` for frequently toggled UI** - Instant transitions, preserved state
2. **Use `useEffectEvent` for callback dependencies** - Eliminates re-renders, cleaner code
3. **Enable PPR on mixed pages** - 20x faster perceived performance
4. **Avoid deprecated patterns** - Follow ESLint v7 rules, use modern APIs
5. **Test with latest values** - Ensure `useEffectEvent` functions access current state

## Additional Resources

- [React 19.2 Release Notes](https://react.dev/blog/2024/12/05/react-19-2)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [Next.js Partial Pre-rendering](https://nextjs.org/docs/app/building-your-application/rendering/partial-prerendering)
- [MakerKit React 19.2 Tutorial](https://makerkit.dev/blog/tutorials/react-19-2)
