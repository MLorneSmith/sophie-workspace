# Payload CMS Custom Components: Separate Test Environment Plan

This document outlines a comprehensive implementation plan for setting up a separate test environment to evaluate historical commits for Payload CMS custom components.

## 1. Setting Up the Separate Test Environment

### 1.1 Create Test Directory Structure

```bash
# Create a parent directory for testing
mkdir -p d:/SlideHeroes/App/repos/payload-test
cd d:/SlideHeroes/App/repos/payload-test

# Create a directory for test results and documentation
mkdir -p test-results
mkdir -p test-scripts
```

### 1.2 Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/2025slideheroes.git repo
cd repo

# Install dependencies
pnpm install
```

### 1.3 Supabase Setup

```bash
# Initialize Supabase in the test directory
cd d:/SlideHeroes/App/repos/payload-test
supabase init

# Start Supabase (this will create a fresh Postgres instance)
supabase start
```

### 1.4 Environment Configuration

Create environment files for Payload CMS:

```bash
# Create .env file for Payload
cd d:/SlideHeroes/App/repos/payload-test/repo/apps/payload
```

Create a new `.env.test` file:

```
PAYLOAD_SECRET=your-test-secret-key
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3020
NEXT_PUBLIC_SERVER_URL=http://localhost:3020

# Database settings
POSTGRES_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Ensure this is different from your main dev port
PORT=3020
```

## 2. Automating the Testing Process

### 2.1 Create Test Script

Create a PowerShell script to automate testing for each commit:

```powershell
# Create test script file
cd d:/SlideHeroes/App/repos/payload-test/test-scripts
```

Create `test-commit.ps1`:

```powershell
param (
    [Parameter(Mandatory=$true)]
    [string]$CommitHash,

    [Parameter(Mandatory=$true)]
    [string]$CommitDescription
)

$testResultDir = "../test-results/$CommitHash"
$repoDir = "../repo"

# Create test result directory
New-Item -ItemType Directory -Force -Path $testResultDir

# Log test start
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path "$testResultDir/test-log.md" -Value "# Test: $CommitHash - $CommitDescription`n`n**Started:** $timestamp`n"

# Navigate to repo directory
Set-Location $repoDir

# Checkout the commit
git checkout $CommitHash

# Install dependencies
Write-Output "Installing dependencies..."
pnpm install
Add-Content -Path "$testResultDir/test-log.md" -Value "## Environment Setup`n`n- Dependencies installed`n"

# Copy .env.test to .env
Copy-Item -Path "apps/payload/.env.test" -Destination "apps/payload/.env" -Force

# Run migration to set up schema
Set-Location apps/payload
Write-Output "Setting up database schema..."
pnpm payload migrate:refresh
Add-Content -Path "$testResultDir/../../test-log.md" -Value "- Database schema migrated`n"

# Start the development server in the background
Write-Output "Starting Payload CMS..."
Start-Process -FilePath "pnpm" -ArgumentList "dev" -NoNewWindow

# Wait for server to start
Start-Sleep -Seconds 30
Add-Content -Path "$testResultDir/../../test-log.md" -Value "- Payload CMS server started`n"

# Prompt for manual testing
Write-Output "`n=========================================================="
Write-Output "MANUAL TESTING REQUIRED"
Write-Output "=========================================================="
Write-Output "Please perform the following tests:"
Write-Output "1. Check if custom component input cards display in the editor"
Write-Output "2. Check if saved content with components can be viewed"
Write-Output "3. Document any errors in the test-results/$CommitHash directory"
Write-Output "`nPress any key when testing is complete..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Stop the development server
Write-Output "Stopping Payload CMS..."
Get-Process -Name "node" | Where-Object { $_.CommandLine -like "*payload*" } | Stop-Process -Force
Add-Content -Path "$testResultDir/../../test-log.md" -Value "- Payload CMS server stopped`n"

# Return to original directory
Set-Location ../../..

# Log test completion
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path "$testResultDir/test-log.md" -Value "`n**Completed:** $timestamp`n"

Write-Output "Test completed. Results saved to $testResultDir"
```

### 2.2 Create Documentation Template

Create a template file `template.md` in the test-scripts directory:

````markdown
# Custom Component Test: [COMMIT_HASH]

## Commit Information

- **Hash:** [COMMIT_HASH]
- **Description:** [COMMIT_DESCRIPTION]
- **Date:** [COMMIT_DATE]

## Component Functionality Test Results

### Schema Compatibility

- [ ] Schema migrated successfully
- [ ] Schema migration failed (details below)

### Custom Components in Editor

- [ ] Input cards display correctly in editor
- [ ] Input cards do not display
- [ ] Input cards display with issues (details below)

### Saved Content Viewing

- [ ] Saved content with components displays correctly
- [ ] Saved content with components fails to display
- [ ] Error messages shown (captured below)

## ImportMap Analysis

```json
// Paste the generated importMap here if available
```
````

## Error Messages

```
// Paste any error messages from console here
```

## Screenshots

(Attach screenshots of the editor interface, viewing interface, and error console)

## Notes

(Add any additional observations here)

## Component Implementation Details

(Document how components are registered and how the importMap is generated)

````

## 3. Test Implementation Plan for Each Commit

### 3.1 Testing Commit: 940f4ba6f3b4b83fe935b7856067c257a350cdb

```powershell
cd d:/SlideHeroes/App/repos/payload-test/test-scripts
./test-commit.ps1 -CommitHash "940f4fba6f3b4b83fe935b7856067c257a350cdb" -CommitDescription "Course system"
````

1. After script runs, manually:
   - Open browser to `http://localhost:3020/admin`
   - Log in with admin credentials
   - Test custom components in the editor
   - Test viewing saved content
   - Capture screenshots and error messages
   - Complete the documentation template

### 3.2 Testing Commit: eedae51e5a61c5e231dd06952adc42b053b33a68

```powershell
cd d:/SlideHeroes/App/repos/payload-test/test-scripts
./test-commit.ps1 -CommitHash "eedae51e5a61c5e231dd06952adc42b053b33a68" -CommitDescription "Survey system: Self-Assessment"
```

(Repeat manual testing process)

### 3.3 Testing Commit: 496c4b817cfded77e50a0f5dbc376d642a7e4793

```powershell
cd d:/SlideHeroes/App/repos/payload-test/test-scripts
./test-commit.ps1 -CommitHash "496c4b817cfded77e50a0f5dbc376d642a7e4793" -CommitDescription "payload custom components"
```

(Repeat manual testing process)

### 3.4 Testing Commit: cd19c9406e6dadaa301cb4bcb1552b0b395c7e20

```powershell
cd d:/SlideHeroes/App/repos/payload-test/test-scripts
./test-commit.ps1 -CommitHash "cd19c9406e6dadaa301cb4bcb1552b0b395c7e20" -CommitDescription "Remove Cloudflare R2 Configuration"
```

(Repeat manual testing process)

## 4. ImportMap Investigation

For each commit during testing, capture the generated importMap:

```javascript
// In browser console while testing each commit
console.log(JSON.stringify(window.lexical.importMap, null, 2));
```

This will output the importMap being used, which is crucial for understanding component resolution issues.

## 5. Analyzing Component Registration

During testing of each commit, examine:

1. Component file structure:

   - `blocks/BunnyVideo/Component.tsx`
   - `blocks/CallToAction/Component.tsx`
   - `blocks/TestBlock/Component.tsx`

2. Component registration in block definitions:

   - How `admin.components.Block` is specified
   - Any custom importMap configurations

3. Payload configuration hooks:
   - `afterStartupHook` usage
   - Any custom importMap enhancements

## 6. Comparative Analysis

After testing all commits, create a comparative analysis document that includes:

1. A summary table of all test results:

| Commit | Description       | Schema Compatible | Input Card | View Saved Content | ImportMap Registration |
| ------ | ----------------- | ----------------- | ---------- | ------------------ | ---------------------- |
| 940f4f | Course system     | ✅/❌             | ✅/❌      | ✅/❌              | `<details>`            |
| eedae5 | Survey system     | ✅/❌             | ✅/❌      | ✅/❌              | `<details>`            |
| 496c4b | Custom components | ✅/❌             | ✅/❌      | ✅/❌              | `<details>`            |
| cd19c9 | Remove Cloudflare | ✅/❌             | ✅/❌      | ✅/❌              | `<details>`            |

2. ImportMap evolution analysis:

   - How the importMap structure changed across commits
   - Key differences in component registration

3. Findings and recommendations:
   - Which commit showed the most promising implementation
   - What specific patterns or configurations enabled component functionality
   - Recommendations for implementing a solution

## 7. Clean Up Process

After completing all tests:

```bash
# Stop the Supabase instance
cd d:/SlideHeroes/App/repos/payload-test
supabase stop

# Optional: Remove the Supabase volumes to free up space
supabase db reset
```

## Diagnosing Common Issues

During testing, watch for these common patterns:

1. **ImportMap Conflicts**: Look for multiple components trying to register at the same path

2. **Component Resolution Errors**: Look for errors like:

   ```
   Error: getFromImportMap: PayloadComponent not found in importMap {
     key: "./Component#default"
     PayloadComponent: "./Component#default"
     schemaPath: "./Component#default"
   }
   ```

3. **UI Field Props Mismatch**: Watch for components receiving unexpected props:
   ```
   Unknown block type: undefined
   Available data keys: field, path, permissions, readOnly, schemaPath
   ```

This comprehensive plan provides a structured, isolated approach to testing historical commits without risking your production environment. The documentation templates will ensure consistent evaluation across all commits, and the automated scripts will streamline the testing process.
