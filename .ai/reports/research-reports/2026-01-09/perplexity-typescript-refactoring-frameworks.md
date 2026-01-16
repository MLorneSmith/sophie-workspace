# Perplexity Research: TypeScript Refactoring Frameworks 2024-2025

**Date**: 2026-01-09
**Agent**: perplexity-expert
**Search Type**: Chat API (attempted) / Knowledge Base (fallback)

## Query Summary

Research on best practice frameworks and approaches for refactoring TypeScript code in 2024-2025, including:
- Modern TypeScript refactoring frameworks/methodologies
- TypeScript-specific refactoring patterns
- Automated refactoring tools
- Code quality metrics
- Safe refactoring practices

**Note**: Perplexity API returned 401 errors. This report is based on trained knowledge through May 2025.

---

## 1. Modern TypeScript Refactoring Frameworks

### Martin Fowler's Refactoring Catalog (TypeScript Adaptation)

Fowler's canonical refactoring patterns remain the gold standard, adapted for TypeScript:

#### Core Refactoring Categories

| Category | Key Patterns | TypeScript Considerations |
|----------|--------------|---------------------------|
| **Composing Methods** | Extract Function, Inline Function, Replace Temp with Query | Use type inference; extract to typed functions |
| **Moving Features** | Move Function, Move Field, Extract Class | Leverage interfaces for contracts |
| **Organizing Data** | Replace Primitive with Object, Replace Type Code with Subclasses | Use discriminated unions, branded types |
| **Simplifying Conditional** | Decompose Conditional, Replace Conditional with Polymorphism | Type guards, exhaustive switch |
| **Refactoring APIs** | Separate Query from Modifier, Remove Flag Argument | Use overloads, options objects |

#### TypeScript-Specific Fowler Adaptations

1. **Replace any with Unknown + Type Guard**
   - Before: function process(data: any) { ... }
   - After: function process(data: unknown): data is ProcessedData

2. **Extract Type Alias / Interface**
   - Move inline object types to named interfaces
   - Create discriminated unions for variant types

3. **Replace Magic String with Const Assertion**
   - Before: type Status = string;
   - After: const STATUSES = ['pending', 'active', 'done'] as const;

### SOLID Principles for TypeScript

| Principle | TypeScript Application |
|-----------|----------------------|
| **Single Responsibility** | One class/module = one reason to change; split large files |
| **Open/Closed** | Use interfaces and generics for extensibility |
| **Liskov Substitution** | Proper interface segregation, no type widening |
| **Interface Segregation** | Small, focused interfaces over large ones |
| **Dependency Inversion** | Depend on abstractions (interfaces), use DI containers |

### Functional Refactoring Patterns

For React/Next.js codebases, functional patterns are increasingly preferred:

1. **Replace Class with Functions + Hooks**
2. **Replace Imperative with Declarative** (filter/map instead of for loops)
3. **Replace Mutation with Immutable Update** (spread operators, structuredClone)
4. **Compose Small Pure Functions** (pipe/compose patterns)

---

## 2. TypeScript-Specific Refactoring Patterns

### Type System Improvements

#### Moving from any to Proper Types

| Pattern | When to Use |
|---------|------------|
| **unknown + type guard** | External data, API responses |
| **Generics** | Reusable functions/components |
| **Branded Types** | ID safety, distinct primitives |
| **Discriminated Unions** | Variant states |
| **Template Literal Types** | String patterns |
| **Const Assertions** | Literal inference |

### Module Organization Best Practices

#### Feature-Based Structure (Recommended for 2024-2025)

- src/features/{feature}/components/
- src/features/{feature}/hooks/
- src/features/{feature}/services/
- src/shared/ui/
- src/shared/utils/

#### Barrel Exports: Pros and Cons

**Pros**: Clean imports, explicit API, easier refactoring
**Cons**: Tree-shaking issues, IDE slowdowns, circular deps, build time

**2024-2025 Recommendation**: Use barrels sparingly for public package APIs; prefer direct imports internally.

### React/Next.js Specific Refactoring Patterns

1. **Server/Client Component Separation**
2. **Hook Extraction Pattern** (useQuery instead of useState/useEffect)
3. **Server Action Refactoring** (enhanceAction pattern)

---

## 3. Automated Refactoring Tools

### Static Analysis Tools

| Tool | Purpose |
|------|---------|
| **TypeScript Compiler** | Type checking, --strict, rename symbol |
| **ESLint** | Linting, auto-fix |
| **ts-morph** | Programmatic AST manipulation |
| **jscodeshift** | Codemods |
| **Knip** | Dead code detection |
| **dependency-cruiser** | Dependency analysis |
| **madge** | Circular dependency graphs |

### ESLint Rules for Refactoring Opportunities

- complexity: ['warn', { max: 10 }]
- max-depth: ['warn', { max: 4 }]
- max-lines-per-function: ['warn', { max: 50 }]
- max-params: ['warn', { max: 3 }]
- @typescript-eslint/no-explicit-any: 'error'
- import/no-cycle: 'error'

### Recommended Tool Stack

1. npx knip (dead code)
2. npx madge --circular src/
3. npx eslint src/ --rule 'complexity: error'
4. npx type-coverage --detail

---

## 4. Code Quality Metrics for TypeScript

### Key Metrics and Thresholds

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| Cyclomatic Complexity | <=10 | 11-20 | >20 |
| Lines per Function | <=50 | 51-100 | >100 |
| Function Parameters | <=3 | 4-5 | >5 |
| Nesting Depth | <=3 | 4 | >4 |
| File Lines | <=300 | 301-500 | >500 |
| Type Coverage | >=95% | 80-94% | <80% |
| any Usage | 0 | 1-5 | >5 |

### Identifying God Objects / Files

Detection Criteria:
- >500 lines of code
- >10 public methods
- >15 dependencies (imports)
- >5 responsibilities (mixed concerns)
- High coupling (used by >20 other files)

---

## 5. Safe Refactoring Practices

### Type-Safe Refactoring Strategies

1. **Leverage Type Errors as Guards** - Tighten types first
2. **Exhaustive Pattern Matching** - Use never type
3. **Branded Types for ID Safety** - Prevent ID mixups

### Incremental Migration Patterns

1. **Strangler Fig Pattern** - New alongside old with facade
2. **Parallel Run Pattern** - Compare results, log discrepancies

### Testing Strategies During Refactoring

1. **Characterization Tests** (Golden Master snapshots)
2. **Contract Tests** (test interface, not implementation)
3. **Mutation Testing** (verify tests catch regressions)

### Feature Flags for Safe Rollout

Use flags to gradually migrate to new implementations.

---

## Actionable Framework Summary

### Refactoring Analysis Command Components

1. **Metrics Collection**: complexity, type-coverage, knip, madge
2. **Code Smell Detection**: large files, high complexity, many imports, any usage
3. **Refactoring Recommendations**: Map issues to patterns
4. **Priority Scoring**: (Complexity * 2) + (FileSize * 1) + (Dependencies * 1.5) + (AnyCount * 3)
5. **Safe Refactoring Checklist**: tests pass, strict mode, characterization tests, feature flag

---

## Key Takeaways

1. Use Martin Fowler's patterns adapted for TypeScript
2. Leverage TypeScript compiler as first refactoring tool
3. Measure before refactoring: complexity, type coverage, file size
4. Barrel exports are problematic; prefer direct imports internally
5. Use automated tools: Knip, madge, ESLint
6. Incremental migration with strangler fig and feature flags
7. Test contracts, not implementations
8. React/Next.js: Separate server/client, extract hooks, use server actions

---

*Report generated: 2026-01-09*
*Source: Claude knowledge base (trained through May 2025)*
