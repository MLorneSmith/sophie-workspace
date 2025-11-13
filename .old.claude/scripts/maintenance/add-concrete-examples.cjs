#!/usr/bin/env node

/**
 * add-concrete-examples.cjs
 * Adds concrete examples to agents to improve clarity and understanding
 */

const fs = require("node:fs");
const path = require("node:path");

// Example content for agents that need them
const exampleMappings = {
	"test-analysis-agent": {
		path: "./.claude/agents/testwriters/test-analysis-agent.md",
		examples: `## Examples

### Example 1: Analyzing Jest Test Coverage
**Scenario**: User wants to understand test coverage gaps in their React components.
**Action**:
1. Search for all test files using \`code-search-expert\`
2. Analyze coverage reports with pattern matching
3. Identify untested code paths and edge cases
4. Generate detailed recommendations for missing tests
**Result**: Comprehensive report showing coverage gaps with specific test suggestions for each component.

### Example 2: Vitest Migration Analysis
**Scenario**: Project needs to migrate from Jest to Vitest.
**Action**:
1. Analyze existing Jest configuration and test patterns
2. Identify Jest-specific APIs and mocking patterns
3. Map required changes for Vitest compatibility
4. Generate migration plan with risk assessment
**Result**: Step-by-step migration guide with automated conversion opportunities highlighted.

### Example 3: E2E Test Quality Review
**Scenario**: Playwright tests are flaky and need improvement.
**Action**:
1. Use \`triage-expert\` to diagnose flaky test patterns
2. Analyze wait conditions and async handling
3. Review selector strategies for stability
4. Identify race conditions and timing issues
**Result**: Refactored tests with proper wait strategies and stable selectors, reducing flakiness by 80%.`,
	},

	"react-expert": {
		path: "./.claude/agents/react/react-expert.md",
		examples: `## Examples

### Example 1: React Hook Optimization
**Scenario**: Component re-renders excessively causing performance issues.
**Action**:
1. Profile component with React DevTools Profiler
2. Identify unnecessary re-renders from dependency arrays
3. Implement useMemo and useCallback strategically
4. Optimize context usage to prevent cascading updates
**Result**: 70% reduction in re-renders, improved interaction responsiveness.

### Example 2: Component Architecture Refactoring
**Scenario**: Large component file with mixed concerns needs splitting.
**Action**:
1. Analyze component responsibilities and data flow
2. Extract custom hooks for business logic
3. Create compound component pattern for flexibility
4. Implement proper prop drilling prevention
**Result**: Clean component architecture with 5 focused components and 2 custom hooks.

### Example 3: Server Component Migration
**Scenario**: Next.js app needs optimization with Server Components.
**Action**:
1. Identify components without client interactivity
2. Move data fetching to Server Components
3. Implement proper boundary between Server and Client Components
4. Optimize bundle size by moving heavy libraries server-side
**Result**: 40% reduction in client bundle size, faster initial page load.`,
	},

	"database-postgres-expert": {
		path: "./.claude/agents/database/database-postgres-expert.md",
		examples: `## Examples

### Example 1: Query Performance Optimization
**Scenario**: Complex query taking 30+ seconds on large dataset.
**Action**:
1. Run EXPLAIN ANALYZE to identify bottlenecks
2. Add appropriate indexes on filter and join columns
3. Rewrite query to use CTEs for better optimization
4. Implement partial indexes for specific conditions
**Result**: Query time reduced from 30 seconds to 0.8 seconds.

### Example 2: RLS Policy Implementation
**Scenario**: Multi-tenant application needs row-level security.
**Action**:
1. Design tenant isolation strategy with user_id/tenant_id columns
2. Create RLS policies for SELECT, INSERT, UPDATE, DELETE
3. Add indexes on RLS filter columns for performance
4. Implement secure view with security_invoker=true
**Result**: Complete tenant isolation with no performance degradation.

### Example 3: JSONB Performance Tuning
**Scenario**: Slow searches in JSONB columns storing product metadata.
**Action**:
1. Create GIN indexes with jsonb_path_ops for containment queries
2. Add functional indexes for frequently accessed paths
3. Implement partial indexes for common filter conditions
4. Optimize queries using jsonb operators
**Result**: 100x improvement in JSONB query performance.`,
	},

	"vitest-testing-expert": {
		path: "./.claude/agents/testing/vitest-testing-expert.md",
		examples: `## Examples

### Example 1: Jest to Vitest Migration
**Scenario**: Large codebase needs migration from Jest to Vitest.
**Action**:
1. Analyze Jest configuration and identify incompatible features
2. Update test scripts and configuration files
3. Convert Jest mocks to Vitest vi.mock patterns
4. Migrate snapshot tests and custom matchers
**Result**: Successful migration with 50% faster test execution.

### Example 2: Browser Mode Testing Setup
**Scenario**: Need to test components in real browser environment.
**Action**:
1. Configure Vitest browser mode with Playwright
2. Set up proper test environment for DOM interactions
3. Implement visual regression testing
4. Configure parallel browser testing
**Result**: Comprehensive browser testing catching rendering issues Jest missed.

### Example 3: Test Performance Optimization
**Scenario**: Test suite takes too long to run in CI.
**Action**:
1. Identify slow tests using Vitest reporter
2. Implement test sharding across multiple workers
3. Optimize setup/teardown with proper scoping
4. Use Vitest's threading for CPU-bound tests
**Result**: Test execution time reduced from 15 minutes to 3 minutes.`,
	},

	"framework-nextjs-expert": {
		path: "./.claude/agents/framework/framework-nextjs-expert.md",
		examples: `## Examples

### Example 1: App Router Migration
**Scenario**: Migrate Pages Router application to App Router.
**Action**:
1. Analyze existing pages and API routes structure
2. Convert pages to app directory structure with layouts
3. Migrate data fetching to Server Components
4. Update routing and dynamic segments
**Result**: Modern App Router setup with improved performance and DX.

### Example 2: Hydration Error Resolution
**Scenario**: Application has hydration mismatches in production.
**Action**:
1. Identify components causing hydration errors
2. Fix date/time formatting with proper hydration
3. Handle conditional rendering with suppressHydrationWarning
4. Implement proper client-only component boundaries
**Result**: Zero hydration errors, stable SSR/CSR behavior.

### Example 3: ISR Performance Optimization
**Scenario**: Static pages need optimized incremental regeneration.
**Action**:
1. Implement on-demand revalidation with revalidateTag
2. Configure proper cache headers and CDN integration
3. Optimize data fetching with parallel requests
4. Set up proper error boundaries for failed revalidation
**Result**: 90% cache hit rate, instant page loads with fresh data.`,
	},

	"refactoring-expert": {
		path: "./.claude/agents/refactoring/refactoring-expert.md",
		examples: `## Examples

### Example 1: Extract Method Refactoring
**Scenario**: 200-line function with multiple responsibilities.
**Action**:
1. Identify logical sections within the function
2. Extract validation logic into separate functions
3. Create helper methods for data transformation
4. Implement proper error handling boundaries
**Result**: Original function reduced to 30 lines with 6 focused helper functions.

### Example 2: Remove Code Duplication
**Scenario**: Similar code patterns repeated across 10+ files.
**Action**:
1. Identify common patterns using AST analysis
2. Extract shared logic into utility functions
3. Create generic components for repeated UI patterns
4. Implement proper abstraction without over-engineering
**Result**: 60% reduction in code duplication, improved maintainability.

### Example 3: Complex Conditional Simplification
**Scenario**: Nested if-else statements making code hard to follow.
**Action**:
1. Apply guard clause pattern for early returns
2. Extract complex conditions into named boolean functions
3. Use polymorphism to replace type-checking conditionals
4. Implement strategy pattern for algorithm selection
**Result**: Readable, testable code with clear business logic.`,
	},

	"code-search-expert": {
		path: "./.claude/agents/code-search-expert.md",
		examples: `## Examples

### Example 1: Finding Implementation Details
**Scenario**: Need to find all places where user authentication is handled.
**Action**:
1. Search for "auth" patterns with ripgrep across all files
2. Use AST grep to find authentication decorators/hooks
3. Trace imports to find authentication providers
4. Map out complete authentication flow
**Result**: Comprehensive map of authentication touchpoints across 23 files.

### Example 2: Dependency Usage Analysis
**Scenario**: Identify all usages of deprecated API before upgrade.
**Action**:
1. Search for import statements of deprecated package
2. Find all function calls using the old API
3. Analyze patterns to estimate migration effort
4. Generate list of files requiring updates
**Result**: Complete inventory of 47 files using deprecated API with migration complexity scores.

### Example 3: Cross-Reference Search
**Scenario**: Find all GraphQL queries using specific field.
**Action**:
1. Search for GraphQL query definitions containing field
2. Trace query usage in components
3. Find related mutations and subscriptions
4. Map data flow from API to UI
**Result**: Full understanding of field usage across frontend and backend.`,
	},

	"database-expert": {
		path: "./.claude/agents/database/database-expert.md",
		examples: `## Examples

### Example 1: Cross-Database Migration
**Scenario**: Migrate from MongoDB to PostgreSQL for better relational features.
**Action**:
1. Analyze MongoDB schema and document relationships
2. Design normalized PostgreSQL schema with proper constraints
3. Create migration scripts handling data transformation
4. Implement dual-write strategy for zero-downtime migration
**Result**: Successful migration of 10M documents to relational tables with full data integrity.

### Example 2: Performance Comparison Analysis
**Scenario**: Choose between PostgreSQL and MongoDB for new microservice.
**Action**:
1. Analyze data access patterns and query requirements
2. Benchmark both databases with realistic workload
3. Evaluate operational complexity and scaling options
4. Consider team expertise and ecosystem
**Result**: Data-driven recommendation with performance metrics and trade-offs documented.

### Example 3: Multi-Database Architecture
**Scenario**: Design system using both SQL and NoSQL databases.
**Action**:
1. Identify data domains and access patterns
2. Assign transactional data to PostgreSQL
3. Use MongoDB for flexible document storage
4. Implement data synchronization strategy
**Result**: Optimized architecture leveraging strengths of both database types.`,
	},
};

function insertExamples(filePath, examples, agentName) {
	const fullPath = path.join(process.cwd(), filePath);

	if (!fs.existsSync(fullPath)) {
		console.error(`❌ File not found: ${fullPath}`);
		return false;
	}

	const content = fs.readFileSync(fullPath, "utf-8");

	// Check if examples already exist
	if (content.includes("## Examples") || content.includes("### Example")) {
		console.log(`ℹ️  ${agentName} already has examples, skipping`);
		return false;
	}

	// Find insertion point - preferably at the end of the main content
	let insertionPoint;

	// Look for common ending sections
	const endingMarkers = [
		"## Error Handling",
		"## Output Format",
		"## Best Practices",
		"## Notes",
		"## Important",
	];

	let foundEndingMarker = false;
	for (const marker of endingMarkers) {
		if (content.includes(marker)) {
			insertionPoint = content.indexOf(marker);
			foundEndingMarker = true;
			break;
		}
	}

	if (!foundEndingMarker) {
		// No ending section found, add at the end
		insertionPoint = content.length;
	}

	// Insert the examples
	const before = content.substring(0, insertionPoint);
	const after = content.substring(insertionPoint);
	const updatedContent = `${before}\n${examples}\n\n${after}`.trim() + "\n";

	fs.writeFileSync(fullPath, updatedContent);
	console.log(`✅ Added examples to ${agentName}`);
	return true;
}

function main() {
	console.log("📚 Adding Concrete Examples to Agents\n");

	let successCount = 0;
	let skipCount = 0;
	let errorCount = 0;

	for (const [agentName, config] of Object.entries(exampleMappings)) {
		const result = insertExamples(config.path, config.examples, agentName);

		if (result === true) {
			successCount++;
		} else if (result === false) {
			skipCount++;
		} else {
			errorCount++;
		}
	}

	console.log("\n📊 Summary:");
	console.log(`✅ Successfully updated: ${successCount} agents`);
	console.log(`⏭️  Skipped (already has examples): ${skipCount} agents`);
	console.log(`❌ Errors: ${errorCount} agents`);

	if (successCount > 0) {
		console.log("\n🎉 Concrete examples have been added!");
		console.log(
			"📝 Next step: Re-run quality evaluator to measure improvements",
		);
	}
}

// Run the script
main();
