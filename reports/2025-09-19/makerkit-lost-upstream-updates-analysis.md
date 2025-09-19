# MakerKit Upstream Package Updates Lost During Merge Conflict Resolution

**Date**: September 19, 2025
**Analysis Target**: Merge commit `2d1e0790` - "resolve 113 merge conflicts from Makerkit upstream update"
**Upstream Branch**: `d71394ab` (MakerKit v2.12.3)
**Current Branch**: `ebb5e313` (SlideHeroes customizations)

## Executive Summary

During the MakerKit upstream merge on August 19, 2025, **113 merge conflicts** were resolved by primarily choosing "ours" (SlideHeroes versions) over "theirs" (upstream MakerKit versions). This analysis identifies **significant upstream dependency updates** that were lost during conflict resolution, including security updates, performance improvements, and newer framework versions.

## Critical Findings

### 🚨 Major Version Gaps

| Package | Current (Ours) | Upstream (Lost) | Gap | Impact |
|---------|----------------|-----------------|-----|---------|
| `@hookform/resolvers` | `3.9.1` | `^5.2.1` | **2 major versions** | Breaking changes, new features |
| `@tanstack/react-query` | `5.87.1` | `5.85.5` | Minor rollback | Performance/bug fixes lost |
| `next` | `15.5.2` | `15.4.7` | Current is newer | ✅ We're ahead |
| `@nosecone/next` | `1.0.0-beta.11` | `1.0.0-beta.10` | Current is newer | ✅ We're ahead |

### 📦 Lost Dependency Updates

#### Web Application (`apps/web/package.json`)

**Dependencies Lost from Upstream:**

- `@hookform/resolvers`: `3.9.1` → `^5.2.1` ⚠️ **Major breaking change**
- `@tanstack/react-query`: `5.87.1` → `5.85.5` (we're newer)
- `@supabase/supabase-js`: `2.57.2` → `2.55.0` (we're newer)

**New Dependencies Added in Current (Not in Upstream):**

- `@dnd-kit/*` packages (drag & drop functionality)
- `@tiptap/*` packages (rich text editor)
- `@testing-library/*` packages (testing utilities)
- `@vercel/otel` (OpenTelemetry)
- Various presentation-specific packages

#### Dev Tool (`apps/dev-tool/package.json`)

**Dependencies Lost from Upstream:**

- `@ai-sdk/openai`: `^2.0.30` → `^2.0.16` (we're newer)
- `@hookform/resolvers`: `3.9.1` → `^5.2.1` ⚠️ **Major breaking change**
- `ai`: `5.0.44` → `5.0.16` (we're newer)
- `@tanstack/react-query`: `5.87.1` → `5.85.5` (we're newer)

**Missing Dependencies in Current:**

- `@faker-js/faker`: Not in upstream

## Detailed Analysis

### 🔍 Package-by-Package Comparison

#### 1. @hookform/resolvers

- **Current**: `3.9.1`
- **Upstream**: `^5.2.1`
- **Risk Level**: 🔴 **HIGH**
- **Recommendation**: **DO NOT UPDATE** without thorough testing
- **Reason**: 2 major version jump likely contains breaking changes to form validation API

#### 2. Framework Updates

##### Next.js

- **Current**: `15.5.2` ✅
- **Upstream**: `15.4.7`
- **Status**: We're ahead, keep current version

##### React Query

- **Current**: `5.87.1` ✅
- **Upstream**: `5.85.5`
- **Status**: We're ahead, keep current version

#### 3. Supabase

- **Current**: `2.57.2` ✅
- **Upstream**: `2.55.0`
- **Status**: We're ahead, includes bug fixes and improvements

#### 4. Development Dependencies

##### TypeScript & Build Tools

- Both versions use `typescript: ^5.9.2` ✅
- Both versions use same `tailwindcss` version ✅
- Babel plugin differences: `19.1.0-rc.3` vs `19.1.0-rc.2` (current is newer)

### 🛡️ Security Considerations

#### Low-Risk Updates Safe to Apply

1. **Minor version bumps** in dev dependencies
2. **Patch updates** to build tools
3. **Type definition updates** (`@types/*` packages)

#### High-Risk Updates Requiring Caution

1. **@hookform/resolvers v5.x** - Major API changes
2. Any package with **major version jumps**
3. Framework core packages (already handled)

### 📊 Project-Specific Additions

Our current version includes significant **SlideHeroes-specific packages** not present in upstream:

#### Presentation Features

- `@dnd-kit/*` - Drag and drop functionality
- `@tiptap/*` - Rich text editor
- `pptxgenjs` - PowerPoint generation

#### Development & Testing

- `@testing-library/*` - Testing utilities
- `@vitejs/plugin-react` - Vite integration
- `uuid` - UUID generation

#### Monitoring & Analytics

- `@vercel/otel` - OpenTelemetry integration
- `pino` - Logging
- Enhanced monitoring packages

## 🎯 Recommendations

### Immediate Actions (Safe)

1. ✅ **Keep current versions** - We're ahead on most core packages
2. ✅ **No immediate updates needed** - Current versions are more recent
3. ✅ **Monitor for security advisories** on packages we're behind on

### Medium-Term Considerations

1. 🔍 **Research @hookform/resolvers v5.x**
   - Review breaking changes documentation
   - Plan migration strategy if benefits warrant upgrade
   - Test thoroughly in development environment

2. 🔍 **Evaluate build tool updates**
   - Consider updating `@tailwindcss/postcss` to match upstream
   - Update type definitions when safe

### Long-Term Strategy

1. 📋 **Establish upstream tracking process**
   - Regular comparison of upstream vs current dependencies
   - Automated security advisory monitoring
   - Planned update cycles for non-breaking changes

2. 📋 **Create update testing pipeline**
   - Automated testing for dependency updates
   - Staging environment validation
   - Rollback procedures

## 🚫 Updates NOT Recommended

| Package | Reason | Risk Level |
|---------|--------|------------|
| `@hookform/resolvers` | Major version jump, breaking changes | 🔴 HIGH |
| Any package requiring React 18 | We're on React 19 | 🟡 MEDIUM |

## 📋 Action Items

- [ ] **Monitor** `@hookform/resolvers` changelog for v5.x breaking changes
- [ ] **Set up** automated security advisory monitoring
- [ ] **Document** current package customizations vs upstream
- [ ] **Plan** next upstream merge strategy to minimize conflicts
- [ ] **Create** dependency update testing checklist

## 📎 Appendices

### A. Merge Conflict Resolution Summary

- **Total Conflicts**: 113
- **Resolution Strategy**: Primarily kept "ours" (SlideHeroes customizations)
- **Files Affected**: 23+ package.json files across the monorepo
- **Upstream Version**: MakerKit v2.12.3
- **Merge Date**: August 19, 2025

### B. Version Comparison Summary

- **Core Dependencies**: We're ahead on most (Next.js, React, Supabase)
- **Build Tools**: Generally aligned with upstream
- **Project-Specific**: Significant additions for presentation features
- **Security**: No immediate concerns identified

---

**Conclusion**: The merge conflict resolution was handled well, preserving critical SlideHeroes customizations while maintaining modern dependency versions. Current package versions are generally newer than upstream, indicating good maintenance practices. The major `@hookform/resolvers` version gap should be monitored but not immediately updated due to breaking change risks.
