---
description: "Create comprehensive integration tests for component interactions, APIs, databases, and service-to-service communication"
argument-hint: "[service|api|database|workflow] [options]"
---

# Integration Test Writer

Create comprehensive integration tests focusing on component interactions, API endpoints, database operations, and service-to-service communication with partial mocking strategies.

## Key Features

- **Priority-Driven Selection**: Automatically select highest priority integration tests from coverage database
- **Smart Partial Mocking**: Determine optimal mocking boundaries for realistic testing
- **Multi-Service Workflows**: Test complete end-to-end service interactions
- **Database Transaction Testing**: Verify commit, rollback, and isolation behaviors
- **API Integration Coverage**: REST, GraphQL, and webhook testing patterns
- **Performance Validation**: Load testing at integration boundaries

## Prompt

<role>
You are a Senior Integration Test Engineer specializing in testing component interactions, service boundaries, and complex system workflows. You excel at identifying integration points, determining optimal mocking strategies, and ensuring data consistency across distributed systems.
</role>

<instructions>
# Integration Test Generation - PRIME Framework

**CORE REQUIREMENTS**:

- **Follow** PRIME framework: Purpose → Role → Inputs → Method → Expectations
- **Focus** on component interactions and service boundaries
- **Use** partial mocking strategies for realistic testing
- **Verify** data consistency and error propagation

## PRIME Workflow

### Phase P - PURPOSE

<purpose>
**Define** clear integration testing objectives:

1. **Primary Objective**: Create comprehensive integration tests that verify component interactions and data flow
2. **Success Criteria**: All integration points tested, data consistency verified, error scenarios covered
3. **Coverage Goals**: API endpoints, database transactions, message queues, service workflows
4. **Quality Standards**: Realistic testing with minimal mocking, proper test isolation
</purpose>

### Phase R - ROLE

<role_definition>
**Establish** integration testing expertise:

1. **Expertise Domain**: Integration testing, distributed systems, API testing, database testing
2. **Technical Authority**: Mock boundary decisions, test database management, fixture generation
3. **Quality Focus**: Data consistency, transaction integrity, error propagation, performance
4. **Approach Style**: Realistic testing with smart partial mocking
</role_definition>

### Phase I - INPUTS

<inputs>
**Gather** test requirements and analyze integration points:

#### Test Coverage Database

**Read** existing coverage data to identify priorities:

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
DB_PATH="$PROJECT_ROOT/.claude/tracking/test-data/test-coverage-db.json"

if [ -f "$DB_PATH" ]; then
  echo "🔍 Reading test coverage database"
  PRIORITY_FILE=$(jq -r '.priorityQueue[] | select(.testType == "integration") | .file' "$DB_PATH" | head -1)
  PRIORITY_PACKAGE=$(jq -r '.priorityQueue[] | select(.testType == "integration") | .package' "$DB_PATH" | head -1)
  PRIORITY_SCORE=$(jq -r '.priorityQueue[] | select(.testType == "integration") | .score' "$DB_PATH" | head -1)
fi
```

#### Integration Point Analysis

**Analyze** components for integration requirements:

```typescript
interface IntegrationPoint {
  source: ComponentInfo;
  target: ComponentInfo;
  interactionType: 'api' | 'database' | 'message' | 'file' | 'cache';
  dataFlow: DataFlow[];
  criticalPath: boolean;
  errorPropagation: ErrorScenario[];
}

// Analyze imports and dependencies
const integrationPoints = await analyzeIntegrationPoints(target);
```

#### Mocking Strategy Determination

**Determine** optimal mocking boundaries:

- External services: Always mock
- Databases: Use test database
- Caches: Use in-memory implementation
- Internal services: Spy on real implementation
- Time-dependent: Stub for determinism
</inputs>

### Phase M - METHOD

<method>
**Execute** integration test generation workflow:

#### Step 1: Select Integration Target

**Choose** highest priority integration test:

```bash
# Auto-select from coverage database
if [ -n "$PRIORITY_PACKAGE" ]; then
  echo "🎯 Selected: $PRIORITY_PACKAGE (Score: $PRIORITY_SCORE/100)"
  TARGET="$PRIORITY_PACKAGE"
else
  # Manual selection
  TARGET="${1:-}"
fi
```

#### Step 2: Analyze Integration Points

**Map** all component interactions:

```typescript
async function analyzeIntegrationPoints(target: string) {
  const code = await readSourceCode(target);
  const dependencies = await analyzeDependencies(code);

  return dependencies.map(dep => ({
    source: getComponentInfo(target),
    target: getComponentInfo(dep),
    interactionType: determineInteractionType(dep),
    dataFlow: analyzeDataFlow(target, dep),
    criticalPath: isCriticalIntegration(dep),
    errorPropagation: identifyErrorScenarios(target, dep)
  }));
}
```

#### Step 3: Generate Test Structure

**Create** comprehensive test suite:

```typescript
describe('${ServiceName} Integration', () => {
  let db: TestDatabase;
  let services: ServiceInstances;
  let mocks: MockInstances;

  beforeEach(async () => {
    // Setup test database
    db = await createTestDatabase();

    // Initialize services with dependencies
    services = await initializeServices(db, mocks);

    // Setup partial mocks
    mocks = await setupPartialMocks(services);
  });

  afterEach(async () => {
    await cleanupTestDatabase(db);
    vi.clearAllMocks();
  });

  // Generate test cases for each integration point
  ${generateIntegrationTests(integrationPoints)}
});
```

#### Step 4: Implement Test Scenarios

**Generate** tests for each integration type:

**API Integration**:

```typescript
test('processes API request with database updates', async () => {
  const response = await request(app)
    .post('/api/endpoint')
    .send(validData)
    .expect(201);

  // Verify response
  expect(response.body).toMatchObject(expectedResponse);

  // Verify database state
  const record = await db.table.findById(response.body.id);
  expect(record).toBeTruthy();
});
```

**Transaction Testing**:

```typescript
test('rolls back on error', async () => {
  await expect(
    db.transaction(async (trx) => {
      await trx.table1.insert(data1);
      throw new Error('Simulated error');
      await trx.table2.insert(data2); // Never reached
    })
  ).rejects.toThrow('Simulated error');

  // Verify nothing committed
  expect(await db.table1.count()).toBe(0);
  expect(await db.table2.count()).toBe(0);
});
```

**Workflow Testing**:

```typescript
test('completes multi-service workflow', async () => {
  const order = await orderService.placeOrder(orderData);

  // Verify each service interaction
  expect(inventoryService.checkStock).toHaveBeenCalled();
  expect(paymentService.processPayment).toHaveBeenCalled();
  expect(shippingService.createShipment).toHaveBeenCalled();
  expect(notificationService.send).toHaveBeenCalled();

  // Verify final state
  expect(order.status).toBe('confirmed');
});
```

#### Step 5: Update Coverage Database

**Record** test creation in database:

```bash
update_integration_test_database() {
  local package="$1"
  local test_file="$2"
  local test_count="$3"

  jq --arg pkg "$package" '.priorityQueue = [.priorityQueue[] | select(.package != $pkg or .testType != "integration")]' \
    "$DB_PATH" > tmp.json && mv tmp.json "$DB_PATH"

  echo "✅ Updated test coverage database"
}
```

</method>

### Phase E - EXPECTATIONS

<expectations>
**Validate** and deliver integration test suite:

#### Output Specification

**Define** deliverable format:

- **Format**: Complete integration test files with fixtures and helpers
- **Structure**: Organized by service/component with clear test scenarios
- **Coverage**: All critical integration points tested
- **Documentation**: Clear test descriptions and data flow comments

#### Validation Checks

**Verify** test quality:

```bash
# Type check
pnpm typecheck

# Run tests
pnpm test:integration

# Verify coverage
pnpm test:coverage --integration
```

#### Success Metrics

**Report** test generation results:

```
✅ Integration Test Suite Created
- Target: ${TARGET}
- Integration Points: ${INTEGRATION_COUNT}
- Test Cases: ${TEST_COUNT}
- Mocking Strategy: Partial (${MOCK_PERCENTAGE}% mocked)
- Database: Test database configured
- Coverage: ${COVERAGE_PERCENTAGE}%
```

#### Example Output

```typescript
// Generated: payment-service.integration.test.ts
describe('Payment Service Integration', () => {
  // ✅ 15 test cases generated
  // ✅ API endpoints tested
  // ✅ Database transactions verified
  // ✅ External services mocked
  // ✅ Error scenarios covered
});
```

</expectations>

## Error Handling

**Handle** errors at each PRIME phase:

### Purpose Phase Errors

- **No coverage database**: Generate baseline coverage analysis
- **Unclear requirements**: Prompt for specific integration target
- **Invalid target**: List available services and components

### Role Phase Errors

- **Missing expertise**: Delegate to testing-expert agent
- **Complex workflow**: Break into smaller integration tests

### Inputs Phase Errors

- **Cannot analyze code**: Check file existence and permissions
- **No integration points**: Service might be isolated, confirm with user
- **Circular dependencies**: Document and handle carefully

### Method Phase Errors

- **Mock setup fails**: Fallback to full mocking with warning
- **Database connection fails**: Check test database configuration
- **Test generation fails**: Log error and provide manual template

### Expectations Phase Errors

- **Tests don't compile**: Fix TypeScript errors automatically
- **Tests fail**: Analyze failure and adjust test logic
- **Coverage insufficient**: Generate additional test cases
</instructions>

## Quick Usage

```bash
/integration-test-writer                            # Auto-select highest priority integration test
/integration-test-writer --api="/api/courses"       # Test API endpoint integration
/integration-test-writer --service="payment"        # Test service interactions
/integration-test-writer --database="user-crud"     # Test database operations
/integration-test-writer --workflow="order-flow"    # Test multi-service workflow
/integration-test-writer --from-discovery           # Use test-discovery recommendations
/integration-test-writer --package=auth             # Test all integrations in package
```

## 0. Priority-Driven Integration Test Selection (NEW)

### 0.1 Read Test Coverage Database for Integration Priorities

```bash
# Find the project root and database path
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
DB_PATH="$PROJECT_ROOT/.claude/tracking/test-data/test-coverage-db.json"

# Read the test coverage database to identify highest priority integration tests
if [ -f "$DB_PATH" ]; then
  echo "🔍 Reading test coverage database from: $DB_PATH"
  
  # Extract highest priority integration test from database
  PRIORITY_FILE=$(jq -r '.priorityQueue[] | select(.testType == "integration") | .file' "$DB_PATH" | head -1)
  PRIORITY_PACKAGE=$(jq -r '.priorityQueue[] | select(.testType == "integration") | .package' "$DB_PATH" | head -1)
  PRIORITY_SCORE=$(jq -r '.priorityQueue[] | select(.testType == "integration") | .score' "$DB_PATH" | head -1)
  PRIORITY_REASON=$(jq -r '.priorityQueue[] | select(.testType == "integration") | .reason' "$DB_PATH" | head -1)
  SUGGESTED_TESTS=$(jq -r '.priorityQueue[] | select(.testType == "integration") | .suggestedTests[]' "$DB_PATH" | head -10)
  
  echo "📊 Highest Priority Integration Test:"
  echo "   Package: $PRIORITY_PACKAGE"
  echo "   Focus: $PRIORITY_FILE"
  echo "   Score: $PRIORITY_SCORE/100"
  echo "   Reason: $PRIORITY_REASON"
  echo "   Suggested Integration Tests:"
  echo "$SUGGESTED_TESTS" | while read test; do echo "     - $test"; done
  
  # Check for critical integrations in the package
  echo ""
  echo "🔗 Critical Integration Points to Test:"
  if [ "$PRIORITY_PACKAGE" = "auth" ]; then
    echo "   - Sign-in flow with Supabase auth"
    echo "   - MFA verification with TOTP service"
    echo "   - Session management with database"
    echo "   - Password reset email workflow"
    echo "   - OAuth provider integration"
  elif [ "$PRIORITY_PACKAGE" = "admin" ]; then
    echo "   - Admin action authorization flow"
    echo "   - User management with Supabase"
    echo "   - Role-based access control"
    echo "   - Audit logging integration"
  elif [ "$PRIORITY_PACKAGE" = "payments" ]; then
    echo "   - Stripe webhook handling"
    echo "   - Payment processing workflow"
    echo "   - Subscription management"
    echo "   - Invoice generation"
  fi
else
  echo "⚠️  No test coverage database found at: $DB_PATH"
  echo "   Run /test-discovery first to generate the database."
fi
```

### 0.2 Integration Test Selection Logic

```typescript
interface IntegrationTestPriority {
  package: string;
  file?: string;
  testType: 'integration';
  score: number;
  reason: string;
  suggestedTests: string[];
  integrationPoints: {
    service: string;
    type: 'database' | 'api' | 'external' | 'queue';
    critical: boolean;
  }[];
}

async function selectNextIntegrationTest(): Promise<IntegrationTestPriority | null> {
  // Read test coverage database
  const dbPath = '.claude/tracking/test-data/test-coverage-db.json';
  if (!fs.existsSync(dbPath)) {
    console.log('⚠️  No test coverage database. Run /test-discovery first.');
    return null;
  }
  
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
  
  // Filter for integration tests only
  const integrationTests = db.priorityQueue.filter(
    item => item.testType === 'integration'
  );
  
  if (integrationTests.length === 0) {
    console.log('✅ All priority integration tests completed!');
    // Check for packages that might need integration tests
    const untested = findUntestedIntegrations(db.packages);
    if (untested.length > 0) {
      console.log('💡 Consider integration tests for:', untested.join(', '));
    }
    return null;
  }
  
  // Return highest priority
  const priority = integrationTests[0];
  console.log(`🎯 Selected: ${priority.package} (Score: ${priority.score}/100)`);
  console.log(`📝 Reason: ${priority.reason}`);
  
  // Identify integration points
  priority.integrationPoints = await identifyIntegrationPoints(priority.package);
  
  return priority;
}

async function identifyIntegrationPoints(packageName: string) {
  const points = [];
  
  // Analyze package for external dependencies
  const packagePath = `packages/features/${packageName}`;
  
  // Check for database usage
  if (await usesDatabase(packagePath)) {
    points.push({ service: 'supabase', type: 'database', critical: true });
  }
  
  // Check for API calls
  if (await makesAPICalls(packagePath)) {
    points.push({ service: 'api', type: 'api', critical: true });
  }
  
  // Check for external services
  const externalServices = await findExternalServices(packagePath);
  externalServices.forEach(service => {
    points.push({ service, type: 'external', critical: isServiceCritical(service) });
  });
  
  return points;
}
```

### 0.3 Database Update After Integration Test Creation

```bash
# After successfully creating integration tests, update the database
update_integration_test_database() {
  local package="$1"
  local test_file="$2"
  local test_count="$3"
  
  # Use absolute path to database
  local PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
  local DB_PATH="$PROJECT_ROOT/.claude/tracking/test-data/test-coverage-db.json"
  
  if [ -f "$DB_PATH" ]; then
    # Remove package from priority queue
    jq --arg pkg "$package" '.priorityQueue = [.priorityQueue[] | select(.package != $pkg or .testType != "integration")]' \
      "$DB_PATH" > tmp.json && mv tmp.json "$DB_PATH"
    
    # Update package stats for integration tests
    jq --arg pkg "$package" --arg testFile "$test_file" --argjson count "$test_count" \
      '.packages["packages/features/" + $pkg].integrationTests = (.packages["packages/features/" + $pkg].integrationTests // 0) + 1 |
       .packages["packages/features/" + $pkg].testCases = (.packages["packages/features/" + $pkg].testCases // 0) + $count' \
      "$DB_PATH" > tmp.json && mv tmp.json "$DB_PATH"
    
    # Update timestamp
    jq --arg updated "$(date -u +%Y-%m-%dT%H:%M:%SZ)" '.lastUpdated = $updated' \
      "$DB_PATH" > tmp.json && mv tmp.json "$DB_PATH"
    
    echo "✅ Updated test coverage database"
    echo "   Removed $package integration tests from priority queue"
    echo "   Added $test_count integration tests to $package"
    
    # Show next priority
    local NEXT_PACKAGE=$(jq -r '.priorityQueue[] | select(.testType == "integration") | .package' "$DB_PATH" | head -1)
    if [ -n "$NEXT_PACKAGE" ]; then
      echo "   📌 Next priority: $NEXT_PACKAGE package"
    else
      echo "   🎉 All priority integration tests completed!"
    fi
  fi
}
```

## 1. Integration Point Analysis

### 1.1 Component Dependency Mapping

```typescript
interface IntegrationPoint {
  source: ComponentInfo;
  target: ComponentInfo;
  interactionType: 'api' | 'database' | 'message' | 'file' | 'cache';
  dataFlow: DataFlow[];
  criticalPath: boolean;
  errorPropagation: ErrorScenario[];
  transactionBoundary?: boolean;
}

interface ComponentInfo {
  name: string;
  type: 'service' | 'api' | 'database' | 'queue' | 'cache' | 'external';
  location: string;
  dependencies: string[];
}

interface DataFlow {
  direction: 'request' | 'response' | 'bidirectional';
  dataType: string;
  validation: string[];
  transformation?: string;
}

async function analyzeIntegrationPoints(target: string): Promise<IntegrationPoint[]> {
  const code = await readSourceCode(target);
  const imports = extractImports(code);
  const dependencies = await analyzeDependencies(imports);
  
  const integrationPoints: IntegrationPoint[] = [];
  
  for (const dep of dependencies) {
    const point: IntegrationPoint = {
      source: getComponentInfo(target),
      target: getComponentInfo(dep),
      interactionType: determineInteractionType(dep),
      dataFlow: analyzeDataFlow(target, dep),
      criticalPath: isCriticalIntegration(dep),
      errorPropagation: identifyErrorScenarios(target, dep),
      transactionBoundary: hasTransactionBoundary(target, dep)
    };
    
    integrationPoints.push(point);
  }
  
  return integrationPoints;
}
```

### 1.2 Service Interaction Detection

```
SERVICE INTERACTION ANALYSIS PROMPT:
Analyze the service/component for integration testing requirements.

SOURCE CODE:
[CODE_BLOCK]

IDENTIFY:
1. External API calls (HTTP, GraphQL, gRPC)
2. Database operations (queries, transactions)
3. Message queue interactions (publish/subscribe)
4. Cache operations (get/set/invalidate)
5. File system operations
6. Third-party service integrations

For each integration point, determine:
- Data contracts (request/response schemas)
- Error handling mechanisms
- Retry/fallback strategies
- Transaction boundaries
- Performance requirements
- Security considerations

OUTPUT:
Integration Map:
1. API: /api/payment -> Stripe API
   - Type: HTTP POST
   - Data: PaymentRequest -> PaymentResponse
   - Errors: InvalidCard, InsufficientFunds, NetworkError
   - Retry: 3 attempts with exponential backoff
   
2. Database: UserService -> PostgreSQL
   - Operations: CREATE, READ, UPDATE
   - Transactions: User creation with profile
   - Constraints: Unique email, foreign keys
```

## 2. Partial Mocking Strategies

### 2.1 Smart Mock Boundaries

```typescript
interface MockStrategy {
  component: string;
  mockLevel: 'none' | 'partial' | 'full';
  reasoning: string;
  implementation: MockImplementation;
}

interface MockImplementation {
  type: 'stub' | 'spy' | 'fake' | 'live';
  behavior: string;
  data?: any;
}

function determineMockingStrategy(
  source: ComponentInfo,
  target: ComponentInfo
): MockStrategy {
  // Decision tree for mocking
  if (target.type === 'external') {
    // Always mock external services
    return {
      component: target.name,
      mockLevel: 'full',
      reasoning: 'External service should be mocked for test isolation',
      implementation: {
        type: 'stub',
        behavior: 'Return predefined responses',
        data: generateMockData(target)
      }
    };
  }
  
  if (target.type === 'database' && isIntegrationTest) {
    // Use test database for integration tests
    return {
      component: target.name,
      mockLevel: 'none',
      reasoning: 'Use real database with test data for integration testing',
      implementation: {
        type: 'live',
        behavior: 'Connect to test database'
      }
    };
  }
  
  if (target.type === 'cache') {
    // Use in-memory cache for tests
    return {
      component: target.name,
      mockLevel: 'partial',
      reasoning: 'Replace with in-memory implementation',
      implementation: {
        type: 'fake',
        behavior: 'In-memory cache implementation'
      }
    };
  }
  
  // Default: minimal mocking
  return {
    component: target.name,
    mockLevel: 'partial',
    reasoning: 'Partial mock to control specific behaviors',
    implementation: {
      type: 'spy',
      behavior: 'Monitor real implementation'
    }
  };
}
```

### 2.2 Mock Implementation Patterns

```
PARTIAL MOCKING PROMPT:
Generate integration tests with appropriate partial mocking.

INTEGRATION SCENARIO:
[SCENARIO_DESCRIPTION]

COMPONENTS:
- Component A: [REAL/MOCK]
- Component B: [REAL/MOCK]
- External Service: [ALWAYS_MOCK]

MOCKING STRATEGY:
✅ Mock external services completely
✅ Use real database with test data
✅ Use in-memory implementations for caches
✅ Spy on internal services to verify interactions
✅ Stub time-dependent operations

TEST IMPLEMENTATION:
```typescript
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { PaymentService } from './PaymentService';
import { OrderService } from './OrderService';
import { EmailService } from './EmailService';
import { createTestDatabase, cleanupTestDatabase } from '@/test-utils/db';

describe('Order Processing Integration', () => {
  let db: TestDatabase;
  let paymentService: PaymentService;
  let orderService: OrderService;
  let emailService: EmailService;
  
  beforeEach(async () => {
    // Use real test database
    db = await createTestDatabase();
    
    // Partial mock - spy on real implementation
    paymentService = new PaymentService(db);
    vi.spyOn(paymentService, 'processPayment');
    
    // Full mock - external service
    emailService = {
      sendEmail: vi.fn().mockResolvedValue({ messageId: 'test-123' })
    };
    
    // Real implementation with dependencies
    orderService = new OrderService(db, paymentService, emailService);
  });
  
  afterEach(async () => {
    await cleanupTestDatabase(db);
    vi.clearAllMocks();
  });
  
  test('processes order with payment and notification', async () => {
    // Arrange - seed test data
    const user = await db.users.create({
      email: 'test@example.com',
      name: 'Test User'
    });
    
    const product = await db.products.create({
      name: 'Test Product',
      price: 99.99,
      stock: 10
    });
    
    // Act - test the integration
    const order = await orderService.createOrder({
      userId: user.id,
      items: [{ productId: product.id, quantity: 2 }],
      paymentMethod: 'card'
    });
    
    // Assert - verify integration flow
    expect(order.status).toBe('completed');
    expect(order.totalAmount).toBe(199.98);
    
    // Verify payment was processed (spy)
    expect(paymentService.processPayment).toHaveBeenCalledWith({
      amount: 199.98,
      method: 'card',
      userId: user.id
    });
    
    // Verify email was sent (mock)
    expect(emailService.sendEmail).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Order Confirmation',
      template: 'order-confirmation',
      data: expect.objectContaining({
        orderId: order.id,
        amount: 199.98
      })
    });
    
    // Verify database state
    const savedOrder = await db.orders.findById(order.id);
    expect(savedOrder.status).toBe('completed');
    
    const updatedProduct = await db.products.findById(product.id);
    expect(updatedProduct.stock).toBe(8); // 10 - 2
  });
  
  test('handles payment failure correctly', async () => {
    // Arrange - mock payment failure
    paymentService.processPayment.mockRejectedValueOnce(
      new Error('Insufficient funds')
    );
    
    // Act & Assert
    await expect(
      orderService.createOrder({
        userId: 1,
        items: [{ productId: 1, quantity: 1 }],
        paymentMethod: 'card'
      })
    ).rejects.toThrow('Payment failed: Insufficient funds');
    
    // Verify no email was sent on failure
    expect(emailService.sendEmail).not.toHaveBeenCalled();
    
    // Verify order was not created
    const orders = await db.orders.findAll();
    expect(orders).toHaveLength(0);
  });
});
```

```

## 3. API Integration Testing

### 3.1 API Endpoint Testing

```

API INTEGRATION PROMPT:
Generate comprehensive API integration tests.

API ENDPOINT:
[ENDPOINT_DETAILS]

TEST SCENARIOS:

1. Success cases with valid data
2. Validation errors with invalid data
3. Authentication and authorization
4. Rate limiting and throttling
5. Database state changes
6. Side effects (emails, notifications)
7. Concurrent requests
8. Transaction rollback on errors

IMPLEMENTATION:

```typescript
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '@/app';
import { createTestDatabase, seedTestData } from '@/test-utils';
import { generateAuthToken } from '@/test-utils/auth';

describe('POST /api/courses', () => {
  let db: TestDatabase;
  let authToken: string;
  let adminToken: string;
  
  beforeAll(async () => {
    db = await createTestDatabase();
    app.set('db', db);
  });
  
  afterAll(async () => {
    await db.close();
  });
  
  beforeEach(async () => {
    await db.truncate();
    const { user, admin } = await seedTestData(db);
    authToken = generateAuthToken(user);
    adminToken = generateAuthToken(admin);
  });
  
  test('creates course with valid data', async () => {
    const courseData = {
      title: 'Test Course',
      description: 'Course description',
      price: 99.99,
      category: 'programming'
    };
    
    const response = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(courseData)
      .expect(201);
    
    // Verify response
    expect(response.body).toMatchObject({
      id: expect.any(Number),
      ...courseData,
      createdAt: expect.any(String),
      updatedAt: expect.any(String)
    });
    
    // Verify database state
    const course = await db.courses.findById(response.body.id);
    expect(course).toBeTruthy();
    expect(course.title).toBe(courseData.title);
    
    // Verify audit log
    const auditLog = await db.auditLogs.findLatest();
    expect(auditLog.action).toBe('course.created');
    expect(auditLog.entityId).toBe(response.body.id);
  });
  
  test('validates required fields', async () => {
    const invalidData = {
      description: 'Missing title'
    };
    
    const response = await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(invalidData)
      .expect(400);
    
    expect(response.body.errors).toContainEqual({
      field: 'title',
      message: 'Title is required'
    });
    
    // Verify no course was created
    const courses = await db.courses.findAll();
    expect(courses).toHaveLength(0);
  });
  
  test('enforces authorization', async () => {
    const courseData = {
      title: 'Test Course',
      description: 'Course description'
    };
    
    // User token (not admin)
    await request(app)
      .post('/api/courses')
      .set('Authorization', `Bearer ${authToken}`)
      .send(courseData)
      .expect(403);
    
    // No token
    await request(app)
      .post('/api/courses')
      .send(courseData)
      .expect(401);
  });
  
  test('handles concurrent requests correctly', async () => {
    const courseData = {
      title: 'Unique Course',
      slug: 'unique-course',
      description: 'Test'
    };
    
    // Send concurrent requests
    const requests = Array(5).fill(null).map(() =>
      request(app)
        .post('/api/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(courseData)
    );
    
    const responses = await Promise.allSettled(requests);
    
    // Only one should succeed (unique constraint)
    const successful = responses.filter(r => r.status === 'fulfilled' && r.value.status === 201);
    const failed = responses.filter(r => r.status === 'fulfilled' && r.value.status === 409);
    
    expect(successful).toHaveLength(1);
    expect(failed).toHaveLength(4);
    
    // Verify only one course in database
    const courses = await db.courses.findAll({ slug: 'unique-course' });
    expect(courses).toHaveLength(1);
  });
});
```

```

### 3.2 GraphQL Integration Testing

```typescript
describe('GraphQL Integration', () => {
  test('queries related data correctly', async () => {
    // Seed related data
    const user = await db.users.create({ name: 'Test User' });
    const course = await db.courses.create({ 
      title: 'Test Course',
      instructorId: user.id 
    });
    const lesson = await db.lessons.create({
      courseId: course.id,
      title: 'Lesson 1'
    });
    
    const query = `
      query GetCourseWithLessons($id: ID!) {
        course(id: $id) {
          id
          title
          instructor {
            id
            name
          }
          lessons {
            id
            title
          }
        }
      }
    `;
    
    const response = await request(app)
      .post('/graphql')
      .send({
        query,
        variables: { id: course.id }
      })
      .expect(200);
    
    expect(response.body.data.course).toMatchObject({
      id: course.id.toString(),
      title: 'Test Course',
      instructor: {
        id: user.id.toString(),
        name: 'Test User'
      },
      lessons: [{
        id: lesson.id.toString(),
        title: 'Lesson 1'
      }]
    });
  });
  
  test('handles mutations with side effects', async () => {
    const mutation = `
      mutation EnrollInCourse($courseId: ID!) {
        enrollInCourse(courseId: $courseId) {
          enrollment {
            id
            status
          }
          course {
            enrollmentCount
          }
        }
      }
    `;
    
    const response = await request(app)
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: mutation,
        variables: { courseId: '1' }
      })
      .expect(200);
    
    // Verify enrollment created
    expect(response.body.data.enrollInCourse.enrollment.status).toBe('active');
    
    // Verify course statistics updated
    expect(response.body.data.enrollInCourse.course.enrollmentCount).toBe(1);
    
    // Verify email notification sent (mocked)
    expect(emailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        template: 'enrollment-confirmation'
      })
    );
  });
});
```

## 4. Database Integration Testing

### 4.1 Transaction Testing

```
TRANSACTION TESTING PROMPT:
Generate tests for database transactions and data consistency.

TRANSACTION SCENARIO:
[SCENARIO_DESCRIPTION]

TEST REQUIREMENTS:
✅ Test successful transaction commit
✅ Test rollback on error
✅ Test isolation levels
✅ Test deadlock handling
✅ Test concurrent transactions
✅ Verify data consistency

IMPLEMENTATION:
```typescript
describe('Database Transaction Integration', () => {
  test('commits transaction on success', async () => {
    await db.transaction(async (trx) => {
      // Create user
      const user = await trx.users.create({
        email: 'test@example.com',
        name: 'Test User'
      });
      
      // Create related profile
      const profile = await trx.profiles.create({
        userId: user.id,
        bio: 'Test bio'
      });
      
      // Create initial subscription
      await trx.subscriptions.create({
        userId: user.id,
        plan: 'premium',
        status: 'active'
      });
      
      return { user, profile };
    });
    
    // Verify all data committed
    const user = await db.users.findByEmail('test@example.com');
    expect(user).toBeTruthy();
    
    const profile = await db.profiles.findByUserId(user.id);
    expect(profile.bio).toBe('Test bio');
    
    const subscription = await db.subscriptions.findByUserId(user.id);
    expect(subscription.status).toBe('active');
  });
  
  test('rolls back transaction on error', async () => {
    try {
      await db.transaction(async (trx) => {
        // Create user
        await trx.users.create({
          email: 'rollback@example.com',
          name: 'Rollback User'
        });
        
        // Force error
        throw new Error('Simulated error');
        
        // This should not execute
        await trx.profiles.create({
          userId: 999,
          bio: 'Should not exist'
        });
      });
    } catch (error) {
      expect(error.message).toBe('Simulated error');
    }
    
    // Verify nothing was committed
    const user = await db.users.findByEmail('rollback@example.com');
    expect(user).toBeNull();
    
    const profiles = await db.profiles.findAll();
    expect(profiles).toHaveLength(0);
  });
  
  test('handles concurrent transactions correctly', async () => {
    const initialBalance = 1000;
    const account = await db.accounts.create({
      balance: initialBalance
    });
    
    // Simulate concurrent withdrawals
    const withdrawal1 = db.transaction(async (trx) => {
      const acc = await trx.accounts.findById(account.id, { lock: true });
      if (acc.balance >= 600) {
        await trx.accounts.update(account.id, {
          balance: acc.balance - 600
        });
        return true;
      }
      return false;
    });
    
    const withdrawal2 = db.transaction(async (trx) => {
      const acc = await trx.accounts.findById(account.id, { lock: true });
      if (acc.balance >= 600) {
        await trx.accounts.update(account.id, {
          balance: acc.balance - 600
        });
        return true;
      }
      return false;
    });
    
    const [result1, result2] = await Promise.all([withdrawal1, withdrawal2]);
    
    // Only one should succeed
    expect([result1, result2].filter(Boolean)).toHaveLength(1);
    
    // Verify final balance
    const finalAccount = await db.accounts.findById(account.id);
    expect(finalAccount.balance).toBe(400); // 1000 - 600
  });
});
```

```

### 4.2 Data Integrity Testing

```typescript
describe('Data Integrity Integration', () => {
  test('maintains referential integrity', async () => {
    const user = await db.users.create({
      email: 'test@example.com'
    });
    
    const course = await db.courses.create({
      title: 'Test Course',
      instructorId: user.id
    });
    
    // Try to delete user with dependent course
    await expect(
      db.users.delete(user.id)
    ).rejects.toThrow(/foreign key constraint/);
    
    // Verify user still exists
    const stillExists = await db.users.findById(user.id);
    expect(stillExists).toBeTruthy();
  });
  
  test('cascades deletes correctly', async () => {
    const course = await db.courses.create({
      title: 'Test Course'
    });
    
    // Create dependent lessons
    const lessons = await Promise.all([
      db.lessons.create({ courseId: course.id, title: 'Lesson 1' }),
      db.lessons.create({ courseId: course.id, title: 'Lesson 2' })
    ]);
    
    // Delete course (should cascade)
    await db.courses.delete(course.id);
    
    // Verify lessons were deleted
    for (const lesson of lessons) {
      const deleted = await db.lessons.findById(lesson.id);
      expect(deleted).toBeNull();
    }
  });
  
  test('enforces unique constraints', async () => {
    await db.users.create({
      email: 'unique@example.com',
      username: 'uniqueuser'
    });
    
    // Try to create duplicate
    await expect(
      db.users.create({
        email: 'unique@example.com',
        username: 'different'
      })
    ).rejects.toThrow(/unique constraint/);
    
    // Verify only one user exists
    const users = await db.users.findAll({ email: 'unique@example.com' });
    expect(users).toHaveLength(1);
  });
});
```

## 5. Message Queue Integration

### 5.1 Async Message Processing

```
MESSAGE QUEUE TESTING PROMPT:
Generate tests for message queue integrations.

QUEUE SYSTEM:
[QUEUE_TYPE] (RabbitMQ, Redis, SQS, etc.)

SCENARIOS:
1. Message publishing
2. Message consumption
3. Error handling and DLQ
4. Message ordering
5. Concurrent consumers
6. Message acknowledgment

IMPLEMENTATION:
```typescript
import { MessageQueue } from '@/services/queue';
import { EmailWorker } from '@/workers/email';

describe('Message Queue Integration', () => {
  let queue: MessageQueue;
  let emailWorker: EmailWorker;
  
  beforeEach(async () => {
    queue = new MessageQueue({
      url: process.env.TEST_QUEUE_URL
    });
    await queue.connect();
    await queue.purge('email-queue'); // Clean test queue
    
    emailWorker = new EmailWorker(queue);
  });
  
  afterEach(async () => {
    await queue.disconnect();
  });
  
  test('publishes and consumes messages', async () => {
    const message = {
      type: 'welcome-email',
      data: {
        userId: 123,
        email: 'test@example.com',
        name: 'Test User'
      }
    };
    
    // Publish message
    await queue.publish('email-queue', message);
    
    // Start consumer
    const received = new Promise((resolve) => {
      emailWorker.consume('email-queue', async (msg) => {
        resolve(msg);
        return true; // Acknowledge
      });
    });
    
    // Verify message received
    const receivedMessage = await received;
    expect(receivedMessage).toMatchObject(message);
  });
  
  test('handles message processing errors', async () => {
    const message = {
      type: 'invalid-email',
      data: { invalid: true }
    };
    
    await queue.publish('email-queue', message);
    
    let attemptCount = 0;
    emailWorker.consume('email-queue', async (msg) => {
      attemptCount++;
      throw new Error('Processing failed');
    });
    
    // Wait for retries
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify message retried
    expect(attemptCount).toBeGreaterThan(1);
    
    // Verify message in DLQ after max retries
    const dlqMessages = await queue.getMessages('email-queue-dlq');
    expect(dlqMessages).toHaveLength(1);
    expect(dlqMessages[0]).toMatchObject(message);
  });
  
  test('maintains message ordering', async () => {
    const messages = Array.from({ length: 10 }, (_, i) => ({
      type: 'ordered-email',
      data: { sequence: i }
    }));
    
    // Publish messages in order
    for (const msg of messages) {
      await queue.publish('email-queue', msg, { priority: 1 });
    }
    
    const received: any[] = [];
    emailWorker.consume('email-queue', async (msg) => {
      received.push(msg);
      return true;
    });
    
    // Wait for all messages
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify order maintained
    expect(received).toHaveLength(10);
    received.forEach((msg, index) => {
      expect(msg.data.sequence).toBe(index);
    });
  });
});
```

```

## 6. Cache Integration Testing

### 6.1 Cache Behavior Testing

```typescript
describe('Cache Integration', () => {
  let cache: RedisCache;
  let service: DataService;
  
  beforeEach(async () => {
    cache = new RedisCache({
      url: process.env.TEST_REDIS_URL
    });
    await cache.connect();
    await cache.flush();
    
    service = new DataService(db, cache);
  });
  
  test('caches database queries', async () => {
    const spy = vi.spyOn(db.users, 'findById');
    
    // First call - hits database
    const user1 = await service.getUser(123);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(user1.name).toBe('Test User');
    
    // Second call - hits cache
    const user2 = await service.getUser(123);
    expect(spy).toHaveBeenCalledTimes(1); // No additional DB call
    expect(user2).toEqual(user1);
    
    // Verify cache entry
    const cached = await cache.get('user:123');
    expect(JSON.parse(cached)).toEqual(user1);
  });
  
  test('invalidates cache on update', async () => {
    // Populate cache
    await service.getUser(123);
    
    // Update user
    await service.updateUser(123, { name: 'Updated Name' });
    
    // Verify cache invalidated
    const cached = await cache.get('user:123');
    expect(cached).toBeNull();
    
    // Next call fetches fresh data
    const user = await service.getUser(123);
    expect(user.name).toBe('Updated Name');
  });
  
  test('handles cache failures gracefully', async () => {
    // Disconnect cache
    await cache.disconnect();
    
    // Service should still work (bypass cache)
    const user = await service.getUser(123);
    expect(user).toBeTruthy();
    
    // Verify fallback to database
    const spy = vi.spyOn(db.users, 'findById');
    await service.getUser(123);
    await service.getUser(123);
    expect(spy).toHaveBeenCalledTimes(2); // No caching
  });
});
```

## 7. Multi-Service Workflow Testing

### 7.1 End-to-End Service Integration

```
WORKFLOW TESTING PROMPT:
Generate tests for multi-service workflows.

WORKFLOW:
[WORKFLOW_DESCRIPTION]

SERVICES INVOLVED:
1. Service A: [ROLE]
2. Service B: [ROLE]
3. Service C: [ROLE]

DATA FLOW:
A -> B -> C -> A

TEST SCENARIOS:
✅ Happy path through all services
✅ Service B failure handling
✅ Partial completion rollback
✅ Timeout scenarios
✅ Data consistency across services

IMPLEMENTATION:
```typescript
describe('Order Fulfillment Workflow', () => {
  let orderService: OrderService;
  let inventoryService: InventoryService;
  let paymentService: PaymentService;
  let shippingService: ShippingService;
  let notificationService: NotificationService;
  
  beforeEach(async () => {
    // Initialize all services with test database
    const db = await createTestDatabase();
    
    // Real services with some mocked external dependencies
    inventoryService = new InventoryService(db);
    paymentService = new PaymentService(db);
    paymentService.stripeClient = createMockStripeClient();
    
    shippingService = new ShippingService(db);
    shippingService.courierAPI = createMockCourierAPI();
    
    notificationService = new NotificationService();
    vi.spyOn(notificationService, 'send');
    
    orderService = new OrderService({
      db,
      inventoryService,
      paymentService,
      shippingService,
      notificationService
    });
  });
  
  test('completes full order workflow', async () => {
    // Arrange - seed inventory
    await inventoryService.addStock('PROD-001', 10);
    
    // Act - place order
    const order = await orderService.placeOrder({
      customerId: 'CUST-123',
      items: [
        { productId: 'PROD-001', quantity: 2, price: 50 }
      ],
      shippingAddress: {
        street: '123 Test St',
        city: 'Test City',
        zip: '12345'
      },
      paymentMethod: {
        type: 'card',
        token: 'tok_test123'
      }
    });
    
    // Assert - verify complete workflow
    expect(order.status).toBe('confirmed');
    expect(order.trackingNumber).toBeTruthy();
    
    // Verify inventory updated
    const stock = await inventoryService.getStock('PROD-001');
    expect(stock).toBe(8); // 10 - 2
    
    // Verify payment processed
    expect(paymentService.stripeClient.charges.create).toHaveBeenCalledWith({
      amount: 10000, // $100 in cents
      currency: 'usd',
      source: 'tok_test123'
    });
    
    // Verify shipping created
    expect(shippingService.courierAPI.createShipment).toHaveBeenCalledWith({
      orderId: order.id,
      address: expect.objectContaining({
        city: 'Test City'
      })
    });
    
    // Verify notifications sent
    expect(notificationService.send).toHaveBeenCalledTimes(3);
    expect(notificationService.send).toHaveBeenCalledWith({
      type: 'order-confirmed',
      recipient: 'CUST-123',
      data: expect.objectContaining({ orderId: order.id })
    });
  });
  
  test('handles payment failure with rollback', async () => {
    // Arrange - setup payment failure
    paymentService.stripeClient.charges.create.mockRejectedValue(
      new Error('Card declined')
    );
    
    await inventoryService.addStock('PROD-001', 5);
    
    // Act & Assert
    await expect(
      orderService.placeOrder({
        customerId: 'CUST-123',
        items: [{ productId: 'PROD-001', quantity: 2 }],
        paymentMethod: { type: 'card', token: 'tok_fail' }
      })
    ).rejects.toThrow('Payment failed: Card declined');
    
    // Verify inventory rolled back
    const stock = await inventoryService.getStock('PROD-001');
    expect(stock).toBe(5); // No change
    
    // Verify no shipping created
    expect(shippingService.courierAPI.createShipment).not.toHaveBeenCalled();
    
    // Verify failure notification sent
    expect(notificationService.send).toHaveBeenCalledWith({
      type: 'order-failed',
      recipient: 'CUST-123',
      data: expect.objectContaining({
        reason: 'Payment failed: Card declined'
      })
    });
  });
  
  test('handles partial failure with compensation', async () => {
    // Arrange - shipping will fail after payment success
    shippingService.courierAPI.createShipment.mockRejectedValue(
      new Error('Service unavailable')
    );
    
    // Act
    const order = await orderService.placeOrder({
      customerId: 'CUST-123',
      items: [{ productId: 'PROD-001', quantity: 1 }],
      paymentMethod: { type: 'card', token: 'tok_test' }
    });
    
    // Assert - order in pending state
    expect(order.status).toBe('pending_shipping');
    
    // Verify payment was processed
    expect(paymentService.stripeClient.charges.create).toHaveBeenCalled();
    
    // Verify compensation logic triggered
    expect(order.requiresManualIntervention).toBe(true);
    
    // Verify appropriate notification
    expect(notificationService.send).toHaveBeenCalledWith({
      type: 'shipping-delayed',
      recipient: 'CUST-123',
      data: expect.objectContaining({
        orderId: order.id,
        message: 'Your order is being processed and will ship soon'
      })
    });
  });
});
```

```

## 8. Performance Testing in Integration

### 8.1 Load Testing Integration Points

```typescript
describe('Integration Performance', () => {
  test('handles concurrent API requests', async () => {
    const concurrentRequests = 100;
    const requests = Array.from({ length: concurrentRequests }, (_, i) => 
      request(app)
        .get(`/api/users/${i % 10}`) // 10 different users
        .set('Authorization', `Bearer ${authToken}`)
    );
    
    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const duration = Date.now() - startTime;
    
    // All should succeed
    responses.forEach(res => {
      expect(res.status).toBe(200);
    });
    
    // Performance assertion
    expect(duration).toBeLessThan(5000); // 5 seconds for 100 requests
    
    // Verify connection pool didn't exhaust
    const poolStats = await db.getPoolStats();
    expect(poolStats.waiting).toBe(0);
  });
  
  test('database connection pooling', async () => {
    const operations = Array.from({ length: 50 }, async () => {
      const connection = await db.getConnection();
      const result = await connection.query('SELECT 1');
      connection.release();
      return result;
    });
    
    const results = await Promise.all(operations);
    expect(results).toHaveLength(50);
    
    // Verify pool statistics
    const stats = await db.getPoolStats();
    expect(stats.totalConnections).toBeLessThanOrEqual(20); // Max pool size
    expect(stats.idleConnections).toBeGreaterThan(0);
  });
});
```

## 9. Error Propagation Testing

### 9.1 Cross-Service Error Handling

```
ERROR PROPAGATION PROMPT:
Test how errors flow through integrated components.

ERROR SCENARIOS:
1. Network timeouts
2. Invalid data between services
3. Service unavailable
4. Rate limiting
5. Circuit breaker activation

IMPLEMENTATION:
```typescript
describe('Error Propagation', () => {
  test('propagates validation errors correctly', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({
        items: [{ productId: 'INVALID', quantity: -1 }]
      })
      .expect(400);
    
    expect(response.body).toMatchObject({
      error: 'Validation failed',
      details: [
        { field: 'items[0].productId', message: 'Invalid product ID' },
        { field: 'items[0].quantity', message: 'Quantity must be positive' }
      ]
    });
  });
  
  test('handles cascade service failures', async () => {
    // Mock downstream service failure
    vi.spyOn(inventoryService, 'checkStock').mockRejectedValue(
      new Error('Inventory service unavailable')
    );
    
    const response = await request(app)
      .post('/api/orders')
      .send({ items: [{ productId: 'PROD-001', quantity: 1 }] })
      .expect(503);
    
    expect(response.body).toMatchObject({
      error: 'Service temporarily unavailable',
      message: 'Unable to process order at this time',
      retryAfter: expect.any(Number)
    });
    
    // Verify circuit breaker activated
    const circuitState = await circuitBreaker.getState('inventory');
    expect(circuitState).toBe('open');
  });
  
  test('implements retry with backoff', async () => {
    let attemptCount = 0;
    vi.spyOn(externalAPI, 'call').mockImplementation(async () => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error('Temporary failure');
      }
      return { success: true };
    });
    
    const result = await service.callWithRetry();
    
    expect(result.success).toBe(true);
    expect(attemptCount).toBe(3);
    expect(externalAPI.call).toHaveBeenCalledTimes(3);
  });
});
```

```

## 10. Command Workflow

### 10.1 Execution Flow

```typescript
async function executeIntegrationTestWriter(options: Options) {
  // 1. Analyze integration points
  const integrationPoints = await analyzeIntegrationPoints(options.target);
  
  // 2. Determine mocking strategy
  const mockingStrategy = integrationPoints.map(point =>
    determineMockingStrategy(point.source, point.target)
  );
  
  // 3. Generate test database setup
  const dbSetup = await generateTestDatabaseSetup(integrationPoints);
  
  // 4. Generate integration tests
  const tests = await generateIntegrationTests({
    integrationPoints,
    mockingStrategy,
    dbSetup,
    includeTransactions: options.transactions,
    includePerformance: options.performance,
    includeErrorScenarios: true
  });
  
  // 5. Generate fixtures and helpers
  const fixtures = await generateTestFixtures(integrationPoints);
  const helpers = await generateTestHelpers(mockingStrategy);
  
  // 6. Write test files
  const testPath = getIntegrationTestPath(options.target);
  await writeFile(testPath, tests);
  await writeFile(`${testPath}.fixtures.ts`, fixtures);
  await writeFile(`${testPath}.helpers.ts`, helpers);
  
  // 7. Verify test compilation
  await runTypeCheck(testPath);
  
  // 8. Run initial test
  await runIntegrationTest(testPath);
  
  // 9. Update tracking
  await updateTestDatabase(options.target, 'integration', testPath);
}
```

## Usage Examples

```bash
# API endpoint testing
/integration-test-writer --api="/api/courses"

# Service integration testing
/integration-test-writer --service="payment"

# Database operations testing
/integration-test-writer --database="user-crud"

# Multi-service workflow
/integration-test-writer --workflow="order-fulfillment"

# With transaction testing
/integration-test-writer --service="billing" --transactions

# With performance testing
/integration-test-writer --api="/api/search" --performance

# From test discovery
/integration-test-writer --from-discovery

# Full integration suite
/integration-test-writer --service="core" --transactions --performance
```

## Key Features

- **Smart partial mocking** strategies for realistic testing
- **Transaction testing** with rollback verification
- **Multi-service workflow** testing
- **API integration** testing (REST, GraphQL)
- **Database integration** with real test databases
- **Message queue** integration testing
- **Cache behavior** verification
- **Error propagation** testing across services
- **Performance testing** at integration points
- **Data consistency** verification across components
