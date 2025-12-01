# Perplexity Research: @e2b/code-interpreter v2.x Breaking Changes

**Date**: 2025-12-01
**Agent**: perplexity-expert
**Search Type**: Search API + Chat API
**Topic**: Breaking changes and migration guide for @e2b/code-interpreter v1.5 to v2.x

## Query Summary

Investigated breaking changes in the @e2b/code-interpreter package when upgrading from v1.5.x to v2.0+, including:
- API signature changes
- Sandbox API modifications
- Required parameter changes
- Migration steps for existing implementations
- Current stable versions and release timeline

## Key Findings

### 1. Version History and Current Status

**Current Stable Versions (2025-12-01)**:
- **Python**: `e2b-code-interpreter@2.2.1` (latest)
- **JavaScript/TypeScript**: `@e2b/code-interpreter@2.2.0` (latest)
- **Core E2B SDK**: `e2b@2.4.2`

**Release Timeline**:
- Versions prior to v1.0 are deprecated and yanked from package repositories
- v2.x series represents a significant architectural redesign
- Both v1.x and v2.x are actively maintained with ongoing improvements

### 2. Breaking Changes in v2.0.0+

#### Core Sandbox Interface Changes

The v2.0.0 release fundamentally altered the Sandbox API structure. Key breaking changes include:

**API Class Structure**:
- `SandboxBase` class was modified, breaking implementations that inherited from or depended on the base class
- The Sandbox initialization and creation process changed significantly
- Some methods were removed entirely, while others had their signatures restructured

**Impact**: Existing code using `Sandbox.create()` patterns from v1.x may fail with `TypeError: SandboxBase` errors

#### Method Signature Changes

**Previous v1.x Pattern**:
```javascript
// TypeScript v1.x
const sbx = await Sandbox.create()
await sbx.runCode('x = 1')
const execution = await sbx.runCode('x+=1; x')
console.log(execution.text)
```

**v2.x Pattern** (essentially same method names):
```javascript
// TypeScript v2.x
const sbx = await Sandbox.create()
await sbx.runCode('x = 1')
const execution = await sbx.runCode('x+=1; x')
console.log(execution.text)
```

**Note**: While method names remained similar, underlying class structures and internal implementations changed significantly.

**Python Changes**:
```python
# v1.x pattern
from e2b_code_interpreter import Sandbox
with Sandbox.create() as sandbox:
    sandbox.run_code("x = 1")
    execution = sandbox.run_code("x+=1; x")
    print(execution.text)

# v2.x pattern - method names unchanged but class structure modified
from e2b_code_interpreter import Sandbox
with Sandbox.create() as sandbox:
    sandbox.run_code("x = 1")
    execution = sandbox.run_code("x+=1; x")
    print(execution.text)
```

### 3. Sandbox API Enhancements in v2.x

The v2.x release added several new capabilities:

#### New Methods Added
- **`download_url` / `downloadUrl`** - Download files from sandbox with generated URLs
- **Enhanced stderr handling** - Separate stderr outputs from execution exceptions
- **Environment variable setup** - Pass env vars directly in `sandbox.create()` method
- **Improved Pydantic support** - Both Pydantic v1 and v2 compatibility

#### Execution Object Improvements
- **Serialization support** - Execution objects can now be serialized (important for async/streaming scenarios)
- **Execution results** - `results` field provides structured data instead of just text

#### New Language Runtime Support
- Support for **JavaScript** code execution (not just Python)
- Support for **R** language execution
- Support for **Java** language execution
- **Ruby** runtime support (added in recent updates)

### 4. Migration Path from v1.x to v2.x

#### Step 1: Update Package Version
```bash
# JavaScript/TypeScript
npm install @e2b/code-interpreter@latest

# Python
pip install e2b-code-interpreter --upgrade
```

#### Step 2: Verify API Key Configuration
- Environment variable: `E2B_API_KEY=e2b_***` (unchanged from v1.x)
- No longer required to pass API key explicitly if set as env variable

#### Step 3: Update Sandbox Creation (if using advanced features)
```javascript
// Old pattern (still works)
const sbx = await Sandbox.create()

// New pattern with environment variables
const sbx = await Sandbox.create({
  env: {
    'MY_VAR': 'value',
    'API_KEY': 'secret'
  }
})
```

```python
# Old pattern (still works)
sandbox = Sandbox.create()

# New pattern with environment variables
sandbox = Sandbox.create(env={
    'MY_VAR': 'value',
    'API_KEY': 'secret'
})
```

#### Step 4: Update File Download Patterns
```javascript
// v2.x: New download method available
const downloadUrl = await sbx.downloadUrl('/path/to/file')
```

```python
# v2.x: New download URL method
download_url = sandbox.download_url('/path/to/file')
```

#### Step 5: Verify Deprecation Status
**DEPRECATED Methods**:
- `runCode()` and `runCmd()` were removed from core SDK at one point but then **reinstated in Code Interpreter SDK specifically**
- The Code Interpreter SDK (`@e2b/code-interpreter` and `e2b-code-interpreter`) still uses `runCode()` / `run_code()`

### 5. Known Issues and Compatibility Notes

#### Issue: SandboxBase Type Error
**Error**: `TypeError: SandboxBase` or related inheritance issues
**Cause**: v2.0 restructured the base class interface
**Solution**: Update type imports and avoid direct `SandboxBase` inheritance

#### Issue: Pydantic Version Conflicts
**Fixed in v2.x**: Python SDK now supports both Pydantic v1 and v2
**Migration**: No action needed - v2.x auto-detects installed Pydantic version

#### Issue: Process Output Handling
**Fix in v2.1+**: Process buffer initialization and resizing improved
**Impact**: More reliable stdout/stderr capture

### 6. Version-Specific Improvements (v2.1-v2.2)

**v2.1 Improvements**:
- Fixed environment variable propagation in non-Python languages (R, JavaScript, Java)
- Improved process stderr exception handling
- Better kernel restart propagation

**v2.2 Improvements** (Latest):
- Support for Ruby kernel/runtime execution
- Interactive chart support with data extraction
- Enhanced DataFrame data access from notebooks
- Sequential code execution guarantee

### 7. Temporary Workaround (if migration not possible)

If facing compatibility issues with v2.0.0, the immediate workaround is to pin to the last stable v1.x:

```bash
# JavaScript/TypeScript
npm install "@e2b/code-interpreter@<2.0"

# Python
pip install "e2b-code-interpreter<2.0"
```

This allows maintaining current functionality while planning a proper migration.

## Comparison: v1.x vs v2.x Feature Matrix

| Feature | v1.x | v2.x | Notes |
|---------|------|------|-------|
| Python code execution | Yes | Yes | Enhanced |
| JavaScript code execution | No | Yes | New in v2.x |
| R code execution | No | Yes | New in v2.x |
| Java code execution | No | Yes | New in v2.x |
| Ruby code execution | No | Yes | Added in v2.2 |
| Environment variables in create() | Limited | Yes | Enhanced |
| File download URLs | No | Yes | New `download_url()` method |
| Execution serialization | No | Yes | Important for async ops |
| Pydantic v1 support | Yes | Yes | Both work in v2.x |
| Pydantic v2 support | No | Yes | New support |
| stdout/stderr separation | Basic | Enhanced | Better error handling |

## Sources & Citations

- GitHub Repository: https://github.com/e2b-dev/code-interpreter
- NPM Package: https://www.npmjs.com/package/@e2b/code-interpreter
- PyPI Package: https://pypi.org/project/e2b-code-interpreter/
- E2B Documentation: https://e2b.dev/docs
- E2B Changelog: https://e2b-changelog.framer.website
- Release History: Latest releases (Oct 16, 2025 for Python, ongoing for JS/TS)

## Key Takeaways

1. **v2.x is current recommendation** - All current development uses v2.x; v1.x is legacy
2. **Method names mostly unchanged** - `runCode()` / `run_code()` and `Sandbox.create()` still valid
3. **Breaking change: Internal class structure** - Base class `SandboxBase` was restructured; direct dependencies may fail
4. **New capabilities added**: Multi-language support, download URLs, env var injection, serialization
5. **Migration is straightforward** - For most applications, upgrading is transparent; advanced users may need class structure updates
6. **Environment variables simpler** - No longer need to pass API key explicitly; env variable detection works out of box
7. **Pydantic compatibility fixed** - v2.x works with both Pydantic v1 and v2

## Related Searches

For deeper understanding:
- E2B migration guide: https://e2b.dev/docs/quickstart/migrating-from-v0
- Code Interpreter SDK architecture documentation
- Language runtime support and limitations
- Custom sandbox template building with v2.x
- Advanced streaming and async patterns with v2.x

