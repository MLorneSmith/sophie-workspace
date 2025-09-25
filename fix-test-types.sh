#!/bin/bash

# Script to fix TypeScript test file type assertion errors

echo "Fixing TypeScript type assertion errors in test files..."

# Fix update-building-block-title.action.test.ts
sed -i 's/const result = await updateBuildingBlockTitleAction(/const result = await updateBuildingBlockTitleAction(/g' apps/web/app/home/(user)/ai/canvas/_actions/update-building-block-title.action.test.ts
sed -i 's/);$/\) as { success: boolean; error?: string };/g' apps/web/app/home/(user)/ai/canvas/_actions/update-building-block-title.action.test.ts

# Fix simplify-text.test.ts - add type assertion for result 
sed -i 's/const result = await simplifyTextAction(/const result = await simplifyTextAction(/g' apps/web/app/home/(user)/ai/canvas/_actions/simplify-text.test.ts
sed -i 's/);$/\) as { success: boolean; response?: any; error?: string };/g' apps/web/app/home/(user)/ai/canvas/_actions/simplify-text.test.ts

# Fix course server-actions.test.ts 
sed -i 's/const result = await /const result = await /g' apps/web/app/home/(user)/course/_lib/server/server-actions.test.ts
sed -i 's/Action(/Action(/g' apps/web/app/home/(user)/course/_lib/server/server-actions.test.ts

echo "Type assertion fixes applied"