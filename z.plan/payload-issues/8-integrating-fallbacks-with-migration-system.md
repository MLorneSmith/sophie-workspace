# Integrating Fallbacks with Content Migration System

## Overview

This document outlines how the Enhanced Fallback Mechanisms (Phase 4) will be integrated with our existing content migration system. The integration ensures that the fallback mechanisms are properly deployed and initialized during the content migration process.

## Current Content Migration System

As described in `z.instructions/content-migration-system/comprehensive-guide-04-14.md`, our content migration system operates in three main phases:

1. **Processing**: Prepares content data for migration
2. **Setup**: Creates database structures via migrations
3. **Loading**: Populates tables with processed content

The system is orchestrated through PowerShell scripts, particularly `reset-and-migrate.ps1`, which calls into sub-scripts in the `scripts/orchestration/phases/` directory.

## Integration Points

We'll modify each phase to incorporate the fallback mechanisms:

### 1. Processing Phase Integration

In the processing phase, we'll add preparation for fallback static mappings:

```powershell
# scripts/orchestration/phases/processing.ps1 (modifications)

# Add to existing script
Write-Host "Preparing fallback mappings data..."

# Create directory for fallback mappings if it doesn't exist
$mappingsDir = "packages/content-migrations/src/data/mappings"
if (-not (Test-Path $mappingsDir)) {
    New-Item -ItemType Directory -Force -Path $mappingsDir | Out-Null
    Write-Host "Created mappings directory"
}

# Copy placeholder assets
$assetsDir = "packages/content-migrations/src/data/fallbacks"
if (-not (Test-Path $assetsDir)) {
    New-Item -ItemType Directory -Force -Path $assetsDir | Out-Null
    Write-Host "Created fallbacks directory"
}

$placeholderFiles = @(
    @{
        Path = "$assetsDir/image-placeholder.webp"
        Source = "assets/placeholders/image-placeholder.webp"
    },
    @{
        Path = "$assetsDir/download-placeholder.pdf"
        Source = "assets/placeholders/download-placeholder.pdf"
    },
    @{
        Path = "$assetsDir/thumbnail-placeholder.webp"
        Source = "assets/placeholders/thumbnail-placeholder.webp"
    }
)

foreach ($file in $placeholderFiles) {
    if (-not (Test-Path $file.Path)) {
        Copy-Item -Path $file.Source -Destination $file.Path -Force
        Write-Host "Copied placeholder asset: $($file.Path)"
    }
}
```

### 2. Setup Phase Integration

In the setup phase, we'll create the fallback database structures:

```powershell
# scripts/orchestration/phases/setup.ps1 (modifications)

# Add to existing script after database creation
Write-Host "Setting up fallback database structures..."
try {
    # Create fallback views, functions, and tables
    npx ts-node packages/content-migrations/src/scripts/repair/fallbacks/database/create-fallback-views.ts
    npx ts-node packages/content-migrations/src/scripts/repair/fallbacks/database/create-fallback-functions.ts

    Write-Host "✅ Fallback database structures created successfully"
} catch {
    Write-Host "❌ Failed to create fallback database structures: $_"
    # Continue with migration despite errors - we don't want to fail the whole process
}
```

### 3. Loading Phase Integration

In the loading phase, we'll generate the static mappings after content is loaded:

```powershell
# scripts/orchestration/phases/loading.ps1 (modifications)

# Add to the end of the existing script
Write-Host "Generating fallback relationship mappings..."
try {
    # Generate static mappings from loaded content
    npx ts-node packages/content-migrations/src/scripts/repair/fallbacks/database/generate-static-mappings.ts

    Write-Host "✅ Fallback relationship mappings generated successfully"
} catch {
    Write-Host "❌ Failed to generate fallback mappings: $_"
    # Continue with migration despite errors
}
```

### 4. New Fallbacks Phase Script

We'll create a dedicated script for the fallbacks phase to be called after the loading phase:

```powershell
# scripts/orchestration/phases/fallbacks.ps1

# Fallbacks phase script for the content migration system
# This runs after the loading phase to fully deploy fallback mechanisms

$ErrorActionPreference = "Stop"
$startTime = Get-Date

Write-Host "==== Starting Enhanced Fallback Mechanisms Phase ===="

try {
    # Step 1: Deploy API-level fallbacks
    Write-Host "Deploying API-level fallbacks..."
    npx ts-node packages/content-migrations/src/scripts/repair/fallbacks/payload/create-hooks.ts
    npx ts-node packages/content-migrations/src/scripts/repair/fallbacks/payload/create-api-endpoints.ts
    npx ts-node packages/content-migrations/src/scripts/repair/fallbacks/payload/register-fallbacks.ts

    # Step 2: Deploy UI-level fallbacks
    Write-Host "Deploying UI-level fallbacks..."
    npx ts-node packages/content-migrations/src/scripts/repair/fallbacks/ui/create-error-components.ts
    npx ts-node packages/content-migrations/src/scripts/repair/fallbacks/frontend/create-error-boundaries.ts

    # Step 3: Verify fallbacks
    Write-Host "Verifying fallback mechanisms..."
    npx ts-node packages/content-migrations/src/scripts/verification/verify-fallbacks.ts

    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    Write-Host "==== Enhanced Fallback Mechanisms Phase completed in $duration seconds ===="
    return $true
} catch {
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    Write-Host "❌ Error in Fallback Mechanisms Phase after $duration seconds:"
    Write-Host $_.Exception.Message
    return $false
}
```

### 5. Update Main Orchestration Script

Finally, we'll update the main reset-and-migrate.ps1 script to include the fallbacks phase:

```powershell
# reset-and-migrate.ps1 (modifications)

# Add to existing phases in the script
Write-Host "=== PHASE 4: Enhanced Fallback Mechanisms ==="
$fallbacksResult = & "$PSScriptRoot\scripts\orchestration\phases\fallbacks.ps1"
if (-not $fallbacksResult) {
    Write-Host "❌ Fallback mechanisms phase failed. See logs for details."
    # Continue with the process despite errors
}
```

## Fallback Initialization in Payload Config

To ensure the fallback mechanisms are properly initialized when Payload CMS starts, we'll add code to the Payload configuration file:

```typescript
// apps/payload/src/payload.config.ts (modifications)
import { buildConfig } from 'payload/config';

import { registerFallbackSystem } from './extensions/fallback-system';

// Original config definition
const baseConfig = {
  // existing config options
};

// Apply fallback mechanisms
const config = registerFallbackSystem(baseConfig);

export default buildConfig(config);
```

## Component Registration in Frontend

For the frontend components, we'll create an initialization file that can be imported in the app:

```typescript
// apps/web/components/fallbacks/index.ts

export {
  RelationshipErrorBoundary,
  withRelationshipErrorBoundary,
} from './RelationshipErrorBoundary';
export { MediaFallback, DownloadFallback } from './MediaFallback';
export { ContentPlaceholder } from './ContentPlaceholder';

/**
 * Initialize fallback components
 * This should be called in the app's main layout
 */
export function initializeFallbacks() {
  // Register error handlers
  window.addEventListener('error', (event) => {
    // If the error is a relationship error, log it
    if (
      event.error?.message?.includes('relationship') ||
      event.message?.includes('relationship')
    ) {
      fetch('/api/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: event.error?.message || event.message,
          stack: event.error?.stack,
          type: 'relationship',
          url: window.location.href,
        }),
      }).catch(console.error);
    }
  });
}
```

And include it in a layout component:

```tsx
// apps/web/app/layout.tsx (modifications)
import { initializeFallbacks } from '@/components/fallbacks';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize fallbacks on client-side only
  if (typeof window !== 'undefined') {
    initializeFallbacks();
  }

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

## Testing and Verification

After integrating the fallback mechanisms with the content migration system, we need to verify that everything works as expected:

```powershell
# scripts/test-fallback-integration.ps1

$ErrorActionPreference = "Stop"

Write-Host "Testing fallback integration with content migration system..."

# Step 1: Run the content migration
& "$PSScriptRoot\..\reset-and-migrate.ps1"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Content migration failed"
    exit $LASTEXITCODE
}

# Step 2: Verify fallbacks
Write-Host "Verifying fallback mechanisms..."
npx ts-node packages/content-migrations/src/scripts/verification/verify-fallbacks.ts

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Fallback verification failed"
    exit $LASTEXITCODE
}

# Step 3: Start the app and test frontend components
Write-Host "Starting app to test frontend components..."
cd apps/web
npx next dev &
$appPid = $!

# Wait for app to start
Start-Sleep -Seconds 10

# Run browser tests (in a real implementation, we would have automated tests)
Write-Host "Testing frontend fallback components..."
# Example: Use Playwright to test components

# Kill the app
Stop-Process -Id $appPid

Write-Host "✅ Fallback integration tests completed successfully"
```

## Troubleshooting Guide

If issues arise during the integration, follow these troubleshooting steps:

1. Check the migration logs in `z.migration-logs/` directory
2. Verify that all fallback files have been created:
   - Database views and functions: Use SQL query tools
   - Payload components: Check apps/payload/src/components/fallbacks/
   - Frontend components: Check apps/web/components/fallbacks/
3. Try running the verification script directly:
   ```
   npx ts-node packages/content-migrations/src/scripts/verification/verify-fallbacks.ts
   ```
4. Check if Payload CMS is using the fallback system:
   - Look for log entries containing "fallbacks"
   - Verify that the extension is registered in the Payload config

## Conclusion

With this integration plan, the Enhanced Fallback Mechanisms will be properly incorporated into our content migration system. This ensures that whenever content is migrated, the fallback mechanisms are set up and ready to provide resilience against relationship issues and other content access problems.

The integration leverages the existing scripts and workflow, adding specific steps for the fallback mechanisms while ensuring they don't interfere with the core migration process.
