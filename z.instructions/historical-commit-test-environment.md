# Historical Commit Test Environment

This document provides comprehensive documentation for the separate test environment created to evaluate historical commits in the SlideHeroes repository.

## Overview

The test environment is a dedicated, isolated setup that allows us to safely test different historical commits of our codebase without affecting the main development environment. While it was initially created to investigate issues with Payload CMS custom components, it can be used to test any aspect of the repository.

### Purpose

The primary purposes of this test environment are:

1. **Historical Commit Evaluation**: Test specific historical commits to identify when and how features were working correctly.
2. **Safe Schema Testing**: Test commits that require schema changes without risking data loss in the main development environment.
3. **Isolated Feature Testing**: Test features in isolation without interference from other parts of the codebase.
4. **Regression Testing**: Verify that fixes for issues don't reintroduce previously resolved problems.
5. **Compatibility Testing**: Test compatibility between different versions of dependencies.

## Environment Structure

The test environment is located at `d:/SlideHeroes/App/repos/slideheroes-test/` and has the following structure:

```
slideheroes-test/
├── repo/                     # Cloned repository for testing
│   └── apps/
│       └── payload/
│           └── .env.test     # Test environment configuration
├── supabase/                 # Supabase configuration
│   └── config.toml           # Custom Supabase configuration with unique ports
├── test-results/             # Directory for storing test results
│   └── [commit-hash]/        # Results for each tested commit
│       └── test-log.md       # Test log for the commit
└── test-scripts/             # Testing scripts
    ├── test-commit.ps1       # PowerShell script for testing a commit
    └── template.md           # Template for documenting test results
```

### Key Components

1. **Separate Repository**: A clean clone of the main repository, allowing us to checkout different commits without affecting the main codebase.
2. **Custom Supabase Instance**: A separate Supabase instance with custom ports to avoid conflicts with the main development environment.
3. **Test Scripts**: Automated scripts to streamline the testing process.
4. **Documentation Templates**: Structured templates for consistent documentation of test results.

## Port Configuration

To avoid conflicts with the main development environment, the test environment uses different ports:

| Service           | Main Environment | Test Environment |
| ----------------- | ---------------- | ---------------- |
| Supabase API      | 54321            | 54331            |
| Supabase DB       | 54322            | 54332            |
| Supabase Studio   | 54323            | 54333            |
| Supabase Inbucket | 54324            | 54334            |
| Analytics         | 54327            | 54337 (disabled) |
| DB Pooler         | 54329            | 54339            |

## How to Use the Test Environment

### Prerequisites

- Docker Desktop running
- Node.js and pnpm installed
- Supabase CLI installed

### Testing a Specific Commit

1. **Start the Supabase Instance**:

   ```powershell
   Set-Location -Path d:/SlideHeroes/App/repos/slideheroes-test
   supabase start
   ```

2. **Run the Test Script**:

   ```powershell
   Set-Location -Path d:/SlideHeroes/App/repos/slideheroes-test/test-scripts
   ./test-commit.ps1 -CommitHash "<commit-hash>" -CommitDescription "<description>"
   ```

   Replace `<commit-hash>` with the Git commit hash you want to test and `<description>` with a brief description of the commit.

3. **Manual Testing**:

   After the script sets up the environment, it will prompt you to perform manual testing. You can:

   - Open a browser to `http://localhost:3020/admin` to access the Payload CMS admin interface
   - Test the specific features you're investigating
   - Document your findings in the test results directory

4. **Complete the Test**:

   Press any key in the terminal to complete the test. The script will:

   - Stop the development server
   - Log the test completion
   - Save the results to the test-results directory

5. **Document Your Findings**:

   Copy the template from `test-scripts/template.md` to `test-results/<commit-hash>/results.md` and fill it out with your findings.

### Cleaning Up

When you're done testing, stop the Supabase instance:

```powershell
Set-Location -Path d:/SlideHeroes/App/repos/slideheroes-test
supabase stop
```

## Customizing the Test Environment

### Modifying the Test Script

You can modify the `test-commit.ps1` script to customize the testing process. For example:

- Change the wait time for the server to start
- Add additional setup steps
- Modify the cleanup process

### Testing Different Applications

While the initial setup focuses on Payload CMS, you can modify the script to test other applications in the repository:

1. **Testing the Web App**:

   Modify the script to navigate to the web app directory and start the development server:

   ```powershell
   Set-Location apps/web
   pnpm dev
   ```

2. **Testing Other Packages**:

   For testing specific packages, navigate to the package directory and run the appropriate commands.

## Troubleshooting

### Supabase Port Conflicts

If you encounter port conflicts when starting Supabase, modify the `config.toml` file to use different ports.

### Database Migration Issues

If you encounter issues with database migrations:

1. Check the Supabase logs:

   ```powershell
   supabase logs
   ```

2. Reset the database:

   ```powershell
   supabase db reset
   ```

### Node Process Cleanup

If the script fails to stop the Node.js processes, you can manually stop them:

```powershell
Get-Process -Name "node" | Where-Object { $_.CommandLine -like "*payload*" } | Stop-Process -Force
```

## Example Use Cases

### Testing Payload CMS Custom Components

The environment was initially set up to test custom components in the Payload CMS Lexical editor. You can:

1. Test different historical commits to identify when components were working correctly
2. Analyze the ImportMap configuration in different versions
3. Understand how component registration affects functionality

### Testing Database Schema Changes

You can use the environment to safely test commits that make significant database schema changes:

1. Checkout a commit with schema changes
2. Run the migrations in the isolated environment
3. Verify that the schema changes work as expected

### Testing API Integrations

You can test API integrations with external services:

1. Configure the environment variables for the test environment
2. Test the API integration in isolation
3. Verify that the integration works as expected

## Conclusion

This test environment provides a flexible, isolated setup for testing any aspect of the SlideHeroes repository. By allowing you to safely checkout and test historical commits, it helps identify when and how features were working correctly, making it easier to diagnose and fix issues.
