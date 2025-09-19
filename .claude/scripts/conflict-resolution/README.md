# Conflict Resolution Tools

This directory contains tools to help with git merge conflict resolution, particularly after merging upstream changes from MakerKit.

## compare-package-versions.sh

This script analyzes package.json differences after merge conflict resolution to identify potentially missed package updates.

### When to Use

Use this script after resolving merge conflicts where you chose "ours" for package.json files. This commonly happens when:
- Merging upstream MakerKit updates
- Resolving conflicts in monorepo workspace packages
- After running `/resolve-merge-conflicts` command

### What It Does

1. **Detects Merge Status**: Checks if a merge is in progress
2. **Compares Package Files**: Analyzes differences between current and upstream package.json files
3. **Identifies Missing Updates**: Shows dependencies that exist only in upstream
4. **Runs Security Audit**: Checks for known vulnerabilities
5. **Suggests Safe Updates**: Recommends patch and minor version updates

### Usage

```bash
# Run the comparison tool
.claude/scripts/conflict-resolution/compare-package-versions.sh

# The script will:
# 1. Show package differences from upstream
# 2. List available updates (patch/minor/major)
# 3. Provide commands to apply updates safely
```

### Integration with Slash Commands

This script is automatically called by the `/resolve-merge-conflicts` command after conflicts are resolved. It helps ensure you don't miss important package updates when choosing "ours" during conflict resolution.

### Safe Update Strategy

The script recommends a conservative update approach:
- **Patch updates** (1.0.0 → 1.0.1): Bug fixes, always safe
- **Minor updates** (1.0.0 → 1.1.0): New features, backward compatible
- **Major updates** (1.0.0 → 2.0.0): Breaking changes, require manual review

### Example Output

```
📦 Package Version Comparison Tool
==================================

✅ Merge in progress detected

📊 Analyzing package.json files...

📦 apps/web/package.json has differences from upstream
  ⚠️  Dependencies only in upstream (potentially missed):
      - @new/package
      - @updated/library

🔍 Running dependency analysis with npm-check-updates...

📌 Current dependency status:
  react       ^19.0.0  →  ^19.1.0  (minor)
  typescript   5.3.0   →   5.4.0   (minor)
  @kit/ui      1.0.0   →   1.0.5   (patch)

💡 Available update commands:
  • Safe updates (patch/minor): npx npm-check-updates -u --target minor && pnpm install
  • All updates (including major): npx npm-check-updates -u && pnpm install
  • Interactive mode: npx npm-check-updates -i

🔒 Checking for security vulnerabilities...
found 0 vulnerabilities

✅ Analysis complete!
```

### Security Considerations

The script automatically runs security audits to identify:
- Known vulnerabilities in dependencies
- Outdated packages with security fixes
- Dependencies that should be updated urgently

### Best Practices

1. **Run After Merge Conflicts**: Always run after resolving package.json conflicts
2. **Apply Safe Updates First**: Start with patch/minor updates
3. **Test After Updates**: Run your test suite after applying updates
4. **Review Major Updates**: Carefully review breaking changes in major updates
5. **Commit Separately**: Commit package updates in a separate commit for clarity