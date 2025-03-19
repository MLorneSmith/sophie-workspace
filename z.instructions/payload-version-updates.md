# Payload CMS Version Update Guide

This document outlines the process for updating Payload CMS versions in the SlideHeroes project. Payload CMS is under active development, and new versions are released regularly. This guide will help ensure that all necessary files are updated consistently to avoid version mismatch issues.

## Files That Require Updates

When updating Payload CMS to a new version, the following files must be updated:

1. **Main Payload App Package:**

   - `apps/payload/package.json`

2. **Payload Integration Package:**

   - `packages/cms/payload/package.json`

3. **Any Other Packages Using Payload:**
   - Check for any other packages that might depend on Payload directly

## Payload-Related Dependencies

In addition to the core Payload package, the following Payload-related dependencies should be updated to compatible versions:

1. **Database Adapters:**

   - `@payloadcms/db-postgres`

2. **Framework Integrations:**

   - `@payloadcms/next`

3. **Plugins:**

   - `@payloadcms/plugin-nested-docs`
   - `@payloadcms/payload-cloud`
   - `@payloadcms/richtext-lexical`

4. **Internal Dependencies:**
   - `@payloadcms/drizzle` (dependency of `@payloadcms/db-postgres`)

## Update Process

Follow these steps to update Payload CMS:

### 1. Check for Breaking Changes

Before updating, check the [Payload CMS changelog](https://github.com/payloadcms/payload/blob/main/CHANGELOG.md) for any breaking changes that might affect your implementation.

### 2. Update Package Files

Update the version numbers in all relevant package.json files:

```bash
# Example: Updating to version 3.28.1
sed -i 's/"payload": "3.26.0"/"payload": "3.28.1"/g' apps/payload/package.json
sed -i 's/"payload": "3.26.0"/"payload": "3.28.1"/g' packages/cms/payload/package.json
```

### 3. Pin Plugin Versions

Replace any `latest` references with specific version numbers that are compatible with your Payload version:

```json
"@payloadcms/db-postgres": "3.28.1",
"@payloadcms/next": "3.28.1",
"@payloadcms/payload-cloud": "3.28.1",
"@payloadcms/plugin-nested-docs": "3.28.1",
"@payloadcms/richtext-lexical": "3.28.1"
```

### 4. Install Updated Dependencies

Run the following command to install the updated dependencies:

```bash
pnpm install
```

### 5. Update Types (If Necessary)

If there are type changes, regenerate the Payload types:

```bash
cd apps/payload
pnpm generate:types
```

### 6. Test the Update

Test the update locally to ensure everything works as expected:

```bash
cd apps/payload
pnpm dev
```

### 7. Commit the Changes

Commit all changes in a single commit to maintain version consistency:

```bash
git add apps/payload/package.json packages/cms/payload/package.json
git commit -m "Update Payload CMS to version 3.28.1"
```

## Version Compatibility Matrix

| Payload Version | @payloadcms/db-postgres | @payloadcms/next | @payloadcms/plugin-nested-docs | @payloadcms/richtext-lexical | @payloadcms/payload-cloud |
| --------------- | ----------------------- | ---------------- | ------------------------------ | ---------------------------- | ------------------------- |
| 3.28.1          | 3.28.1                  | 3.28.1           | 3.28.1                         | 3.28.1                       | 3.28.1                    |
| 3.26.0          | 3.26.0                  | 3.26.0           | 3.26.0                         | 3.26.0                       | 3.26.0                    |

## Troubleshooting Common Issues

### Version Mismatch Errors

If you encounter errors like:

```
Attempted import error: 'X' is not exported from 'payload'
```

This typically indicates a version mismatch between Payload and its plugins. Ensure all Payload-related packages are using compatible versions.

### Database Migration Issues

After updating Payload, you might need to run migrations:

```bash
cd apps/payload
pnpm migrate
```

If migrations fail, check the Payload migration documentation for specific instructions related to your version update.

### Plugin Compatibility

Some plugins might not be immediately compatible with new Payload versions. Check the plugin's documentation or GitHub repository for compatibility information.

## Best Practices

1. **Never Mix Versions:** Always ensure all Payload-related packages are using compatible versions.

2. **Avoid Using `latest`:** Instead of using `latest` in package.json, specify exact versions to prevent unintended updates.

3. **Update in a Dedicated Branch:** Create a dedicated branch for Payload updates to isolate any issues.

4. **Test Thoroughly:** Test all Payload-related functionality after updates, including admin UI, API endpoints, and any custom hooks or fields.

5. **Update Documentation:** Update any internal documentation that might be affected by Payload version changes.

## Current Version Information

As of the creation of this document, the project is using:

- Payload CMS: 3.26.0 (Updating to 3.28.1)
- Payload plugins: Various versions (Some using `latest`)

## Additional Resources

- [Payload CMS Documentation](https://payloadcms.com/docs)
- [Payload CMS GitHub Repository](https://github.com/payloadcms/payload)
- [Payload CMS Discord Community](https://discord.com/invite/payload)
