# Test Case Template

Use this template when writing tests for each file in the checklist.

## File: `[file path]`

### Test Setup

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { [functionName] } from '[relative path]';

// Mock dependencies
vi.mock('[dependency path]', () => ({
  // Mock implementation
}));

describe('[Function/Module Name]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test cases below
});
```

### Test Cases Checklist

#### Core Functionality

- [ ] **Test Case**: [Description]
  - **Input**: [Sample input]
  - **Expected Output**: [Expected result]
  - **Status**: ❌ Not Started / 🟡 In Progress / ✅ Complete
  - **Notes**: [Any special considerations]

#### Edge Cases

- [ ] **Test Case**: Handles null/undefined input

  - **Input**: `null` or `undefined`
  - **Expected Output**: Graceful error or default value
  - **Status**: ❌ Not Started
  - **Notes**: Should not throw unexpected errors

- [ ] **Test Case**: Handles empty data
  - **Input**: Empty array/object/string
  - **Expected Output**: Appropriate empty response
  - **Status**: ❌ Not Started
  - **Notes**:

#### Error Scenarios

- [ ] **Test Case**: [Error scenario description]
  - **Input**: [Invalid input that should cause error]
  - **Expected Output**: Specific error message/type
  - **Status**: ❌ Not Started
  - **Notes**:

#### Integration Points

- [ ] **Test Case**: [Integration test description]
  - **Input**: [Complex scenario]
  - **Expected Output**: [Full workflow result]
  - **Status**: ❌ Not Started
  - **Notes**: May require multiple mocks

### Coverage Report

- Lines: 0%
- Branches: 0%
- Functions: 0%
- Statements: 0%

### Notes

- Dependencies mocked: [List mocked dependencies]
- Special considerations: [Any tricky aspects]
- Time spent: [Track time for estimation accuracy]

### Example Test Implementation

```typescript
it('should [behavior description]', async () => {
  // Arrange
  const input = {
    /* test data */
  };
  const expected = {
    /* expected result */
  };

  // Act
  const result = await functionName(input);

  // Assert
  expect(result).toEqual(expected);
});
```
