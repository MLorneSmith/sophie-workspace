# Run Tests

Run all available tests across the project using the correct pnpm scripts.

## Steps

1. Run all tests (unit + E2E):

   ```bash
   # Run unit tests first
   pnpm test

   # Then run E2E tests (includes server orchestration)
   pnpm test:e2e
   ```

2. Run only unit tests (no dev server needed):

   ```bash
   pnpm test
   ```

3. Run only E2E tests (includes server startup):

   ```bash
   # Run E2E tests
   pnpm test:e2e
   ```

4. Run tests for a specific workspace:

   ```bash
   pnpm turbo test --filter=@slideheroes/[workspace-name]
   ```

5. Run tests with coverage:

   ```bash
   pnpm turbo test -- --coverage
   ```

6. Run tests in watch mode:

   ```bash
   pnpm turbo test -- --watch
   ```

7. If tests fail:
   - Review the error output to identify failing tests
   - Check test files for issues
   - Fix the failing tests or update them if requirements changed
   - Re-run tests to verify fixes

8. **Troubleshooting Server Issues** (E2E tests):

   If E2E tests fail with timeout or connection errors, manually clean up:

   ```bash
   # Check for hanging server processes
   ps aux | grep -E "(next|node|supabase)" | grep -v grep

   # Check which processes are using test ports
   ss -tlnp | grep -E ":(3000|3020|54321|54322|54323|54324)"

   # Kill hanging Next.js server processes
   pkill -f "next-server" || echo "No hanging servers found"

   # Stop Supabase instances
   npx supabase stop --project-id e2e
   npx supabase stop

   # If specific PIDs are found, kill them directly
   kill -9 [PID_NUMBER]

   # Verify ports are freed
   ss -tlnp | grep -E ":(3000|3020|543[0-9]{2})" || echo "Ports are now free"

   # Test manual server startup to verify they work
   timeout 15s npx next dev --turbo  # Test web server
   ```

   **Common server issues:**
   - Port conflicts from previous test runs (especially Supabase ports 54321-54326)
   - Hanging processes that don't respond to requests
   - Server startup race conditions in Playwright
   - Performance issues under concurrent test load
   - Multiple Supabase instances running with different project IDs

   **Port conflict prevention:**
   - The E2E test setup script (`apps/e2e/scripts/test-setup.sh`) now automatically checks for port conflicts
   - It will stop existing Supabase instances and kill processes using required ports

9. Report summary of:
   - Total tests run
   - Tests passed/failed
   - Code coverage percentage (if run with coverage)
   - Any test suites with issues

## Notes

- The project uses Turbo for monorepo task orchestration
- Tests are cached by Turbo for faster subsequent runs
- Individual workspaces may have their own test configurations
- Use `--filter` flag to run tests for specific packages
- Common test frameworks in use: Vitest (unit tests), Playwright (E2E tests)
- **Unit tests** (`pnpm test`) exclude E2E tests and run quickly without server
- **E2E tests** (`pnpm test:e2e`) automatically start dev server and run Playwright tests
- E2E tests take longer due to server startup time (~10 seconds)
  // Test comment to trigger pre-commit hooks
