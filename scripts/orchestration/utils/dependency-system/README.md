# Dependency System Documentation

## Overview

The Dependency System is a modular framework that manages dependencies between verification steps and their required fix steps in the content migration process. This system ensures that necessary dependencies are executed before verification steps to prevent false failures.

## Module Structure

The system is organized into the following modules:

### 1. Core Module (`verification-dependencies-core.ps1`)

- Defines shared state and basic utilities
- Manages the dependency definitions between verification steps and fix scripts
- Provides initialization and reset functions

### 2. Graph Module (`verification-dependencies-graph.ps1`)

- Provides functions for traversing the dependency graph
- Resolves dependencies for verification steps
- Checks dependency completion status

### 3. Execution Module (`verification-dependencies-execution.ps1`)

- Manages the execution of dependencies with proper error handling
- Provides caching to avoid redundant execution
- Runs verification steps with automatic dependency resolution

### 4. Visualization Module (`verification-dependencies-visualization.ps1`)

- Displays the dependency graph
- Generates execution reports
- Provides visual representation of dependency status

### 5. Validation Module (`verification-dependencies-validation.ps1`)

- Validates the integrity of the dependency graph
- Identifies circular dependencies
- Detects redundant dependencies

### 6. Main Module (`verification-dependencies-optimized.ps1`)

- Acts as the entry point for the system
- Imports all other modules
- Provides public interface for other scripts

## How to Use the System

### Basic Usage

To use the dependency system in scripts:

```powershell
# Import the dependency system
. "$PSScriptRoot\orchestration\utils\verification-dependencies-improved.ps1"

# Run a verification step with automatic dependency resolution
Invoke-VerificationWithDependencies -VerificationStep "verify:todo-fields" -Description "Verifying todo fields" -ContinueOnError $false
```

### Alternative Usage with Optimized Interface

```powershell
# Import the optimized dependency system directly
. "$PSScriptRoot\orchestration\utils\dependency-system\verification-dependencies-optimized.ps1"

# Initialize the system
Initialize-DependencySystem

# Run a verification step
Invoke-VerificationWithOptimizedDependencies -VerificationStep "verify:todo-fields" -Description "Verifying todo fields" -ContinueOnError $false

# Generate a comprehensive report
Get-DependencySystemReport -IncludeGraph -IncludeValidation
```

## How to Extend the System

### Adding New Dependencies

To add a new verification step dependency:

1. Edit `verification-dependencies-core.ps1`
2. Add a new entry to the `$script:verificationDependencies` hashtable

Example:

```powershell
# New verification step for image processing
$script:verificationDependencies["verify:image-processing"] = @(
    "fix:image-resize",
    "fix:image-optimize",
    "fix:image-metadata"
)
```

### Adding New Functionality

To add new functionality:

1. Determine which module should contain the new functionality based on its purpose
2. Add the new function to the appropriate module
3. Update the documentation to reflect the changes

## Best Practices

1. **Modular Development**:

   - Keep each module focused on its specific responsibility
   - Avoid circular dependencies between modules

2. **Error Handling**:

   - Use proper error handling in all functions
   - Provide meaningful error messages
   - Consider using the `ContinueOnError` parameter appropriately

3. **Documentation**:

   - Comment new functions clearly
   - Update this README when making significant changes

4. **Testing**:
   - Use the included test script to verify changes
   - Add new tests for new functionality

## System Internals

### Dependency Tracking

Dependencies are tracked using the `$script:completedDependencies` array, which stores the names of dependencies that have been successfully executed. This prevents redundant execution of the same dependency.

### Verification Step Resolution

When a verification step is executed, the system:

1. Resolves its dependencies using `Get-VerificationDependencies`
2. Executes each dependency that hasn't been completed yet
3. Runs the verification step only if all dependencies were successful

### Error Handling

The system provides comprehensive error handling:

- Dependencies can be run with or without error continuation
- Verification steps can also be run with error continuation
- Detailed error messages help diagnose issues

## Testing the System

A test script is included to verify the system's functionality:

```powershell
# Change to script directory
cd scripts/orchestration/utils/dependency-system

# Run the test script
./test-dependencies.ps1
```

## Implementation Notes

This modular system represents a refactoring of the original monolithic `verification-dependencies-improved.ps1` script, with the goals of:

1. Improved maintainability through separation of concerns
2. Better code organization
3. Enhanced extensibility
4. Clearer system architecture
5. Easier troubleshooting

The original functionality is maintained through backward compatibility in the main `verification-dependencies-improved.ps1` file, which now acts as a wrapper around the modular system.
