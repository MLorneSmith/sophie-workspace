# Payload CMS Custom Component ImportMap Testing Plan

## Overview

We're experiencing an issue with Payload CMS custom components in the Lexical editor. The problem manifests as a "Catch-22" situation:

1. **Scenario 1: Editable But Can't View Saved Content**

   - When the importMap lacks `"./Component#default": BunnyVideoComponent`
   - ✅ Input card renders properly in editor
   - ❌ Error when viewing saved content: `Error: getFromImportMap: PayloadComponent not found in importMap {key: "./Component#default"...}`

2. **Scenario 2: Can View Saved Content But Can't Edit**
   - When the importMap includes `"./Component#default": BunnyVideoComponent`
   - ✅ Saved content loads without errors
   - ❌ Input card doesn't display in editor

This issue affects all custom components: BunnyVideo, CallToAction, and TestBlock.

## Approach: Restore and Test Previous Commits

We'll investigate whether previous commits had working custom components by:

1. Creating branches from specific historical commits
2. Testing each branch for component functionality
3. Documenting findings to identify when/if components worked correctly

## Commit Restoration Plan

### 1. Preparation Phase

1. **Create a backup branch** of the current state

   ```bash
   git checkout -b backup-current-state-march-25
   git push origin backup-current-state-march-25
   ```

2. **Create a test directory** to track findings
   ```bash
   mkdir -p z.test/payload-component-test
   ```

### 2. Restore and Test Each Commit

We'll test the following commits, with version-numbered branches counting backwards (most recent = v1):

#### For commit cd19c9406e6dadaa301cb4bcb1552b0b395c7e20 (Most Recent):

```bash
# Create and checkout branch with descriptive name and version
git checkout -b payload-components-v1-cd19c9
git checkout cd19c9406e6dadaa301cb4bcb1552b0b395c7e20

# Install dependencies
pnpm install

# Generate the importMap
pnpm generate:importmap

# Start the development server to test
pnpm --filter=payload dev
```

#### For commit 496c4b817cfded77e50a0f5dbc376d642a7e4793:

```bash
# Create and checkout branch with descriptive name and version
git checkout -b payload-components-v2-496c4b
git checkout 496c4b817cfded77e50a0f5dbc376d642a7e4793

# Install dependencies
pnpm install

# Generate the importMap
pnpm generate:importmap

# Start the development server to test
pnpm --filter=payload dev
```

#### For commit eedae51e5a61c5e231dd06952adc42b053b33a68:

```bash
# Create and checkout branch with descriptive name and version
git checkout -b payload-components-v3-eedae5
git checkout eedae51e5a61c5e231dd06952adc42b053b33a68

# Install dependencies
pnpm install

# Generate the importMap
pnpm generate:importmap

# Start the development server to test
pnpm --filter=payload dev
```

#### For commit 940f4fba6f3b4b83fe935b7856067c257a350cdb (Oldest):

```bash
# Create and checkout branch with descriptive name and version
git checkout -b payload-components-v4-940f4f
git checkout 940f4fba6f3b4b83fe935b7856067c257a350cdb

# Install dependencies
pnpm install

# Generate the importMap
pnpm generate:importmap

# Start the development server to test
pnpm --filter=payload dev
```

## Testing Methodology

For each restored commit, we'll:

### 1. Check ImportMap Generation

Examine the generated importMap file to see if custom component entries are included:

```bash
# View the generated importMap
cat apps/payload/src/importMap.ts
```

Look for entries related to custom components, especially:

- `"./Component#default"` mappings
- Custom component path mappings
- Special field mappings

### 2. Test Editing Mode

1. Start the Payload CMS development server
2. Navigate to the editor for a content type with Lexical fields
3. Try to add a custom component
4. Check if the input card renders properly
5. Attempt to configure and save the component

### 3. Test Viewing Mode

1. View a piece of content that contains custom components
2. Check if components render correctly
3. Look for any console errors related to component resolution

### 4. Document Findings

For each commit, create a detailed markdown file with findings:

```
# Payload Components Test - v1 (cd19c9)

## ImportMap Status
- [ ] ImportMap contains custom component entries
- [ ] List of specific entries found:
```

// Copy relevant entries here

```

## Editing Mode
- [ ] Can add new components
- [ ] Input card renders correctly
- [ ] Can configure component properties
- [ ] Can save content with components

## Viewing Mode
- [ ] Can view saved content with components
- [ ] Components render correctly
- [ ] No console errors related to components

## Additional Notes
- Any specific observations
- Error messages encountered
- Differences from other tested commits
```

## Analysis and Next Steps

After testing all commits:

### If a Working Commit is Found:

1. Identify the specific implementation details that made it work
2. Compare with current implementation to spot differences
3. Create a new branch from current state and implement the working solution
4. Test to confirm the fix works in the current codebase

### If No Working Commit is Found:

1. Document patterns and partial solutions across commits
2. Analyze the importMap generation process
3. Consider implementing the comprehensive solution outlined in the existing plan documents
4. Test alternative approaches based on findings

## Documentation

All test results will be stored in:

```
z.test/payload-component-test/payload-components-v1-cd19c9-results.md
z.test/payload-component-test/payload-components-v2-496c4b-results.md
z.test/payload-component-test/payload-components-v3-eedae5-results.md
z.test/payload-component-test/payload-components-v4-940f4f-results.md
```

A final summary report will be created after all tests are complete:

```
z.test/payload-component-test/summary-and-recommendations.md
```
