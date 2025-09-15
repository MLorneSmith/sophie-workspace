---
description: Synchronize the context inventory with actual files in .claude/context
allowed-tools: Read, Write, Edit, Bash(node:*), Bash(npx:*)
category: workflow
---

## Update Context Inventory

Synchronize `.claude/data/context-inventory.json` with the actual files in `.claude/context/`:

### 1. Current inventory status:
!echo "📊 Checking current inventory..." && node -e "const inv = require('./.claude/data/context-inventory.json'); const cats = Object.keys(inv.categories); const total = cats.reduce((sum, c) => sum + inv.categories[c].documents.length, 0); console.log(\`Categories: \${cats.length}\nTotal files: \${total}\nLast updated: \${inv.lastUpdated}\`);" 2>/dev/null || echo "No inventory found"

### 2. Run synchronization:
!node .claude/scripts/inventories/sync-context-inventory.cjs 2>&1 | tee /tmp/sync-output.txt

### 3. Review new files for categorization:

Check if any new files were added that need category review:

!node -e "const output = require('fs').readFileSync('/tmp/sync-output.txt', 'utf-8'); const matches = output.match(/➕ Adding new file: (.+)/g); if (matches) { console.log('\\n🔍 NEW FILES ADDED - Review categories:\\n'); matches.forEach(m => { const file = m.replace('➕ Adding new file: ', ''); console.log('  • ' + file); }); console.log('\\nThese files were auto-categorized. Review the assignments below.'); } else { console.log('✅ No new files added - no category review needed.'); }" 2>/dev/null

### 4. Category verification and adjustment:

If new files were added above, review their automatic category assignments:

@.claude/data/context-inventory.json

**Available categories:**
- `core` - Core project documentation (constraints, schemas, overview)
- `design` - Design documents and architecture decisions
- `roles` - Engineering role definitions
- `standards` - Coding standards, testing practices, guidelines
- `systems` - System documentation (CI/CD, logging, containers)
- `architecture` - Architecture patterns and decisions
- `tools` - Tool documentation and integrations
- `workflow` - Workflow and process documentation
- `rules` - Project rules and policies
- `guides` - How-to guides and tutorials
- `agents` - Agent configurations and documentation
- `technical` - Technical specifications

**To adjust categories:**
If any files need to be moved to different categories, I can help reorganize them. Would you like to:
1. Keep the automatic categorization
2. Move specific files to different categories (I'll use the `adjust-inventory-category.cjs` script)
3. Create new categories for better organization

For manual adjustments, you can also run:
```bash
node .claude/scripts/adjust-inventory-category.cjs "<file-path>" "<new-category>"
```

Example: Move a file from systems to testing category:
```bash
node .claude/scripts/adjust-inventory-category.cjs "systems/test-file.md" "testing"
```

Please review the categorization and let me know if any adjustments are needed.

### 5. Final summary:
The inventory has been synchronized with:
- Token counts updated using accurate counter
- Proper metadata extraction
- Biome formatting applied
- Ready for dynamic context loading