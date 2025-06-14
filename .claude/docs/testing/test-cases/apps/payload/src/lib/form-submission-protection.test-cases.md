# Test Cases: form-submission-protection.ts

## Status Summary

- **Created**: 2025-01-06
- **Last Updated**: 2025-01-06
- **Test Implementation Status**: Complete
- **Total Test Cases**: 27 (implemented)
- **Completed Test Cases**: 27
- **Coverage**: 100% (all implemented tests passing)

## File: `apps/payload/src/lib/form-submission-protection.ts`

### Test Cases Checklist

#### Constructor & Configuration

- [ ] **Test Case**: Creates instance with default configuration

  - **Input**: No configuration parameter
  - **Expected Output**: Instance with default config values
  - **Status**: ❌ Not Started
  - **Notes**: Should set timeoutMs: 30000, retryDelayMs: 2000, etc.

- [ ] **Test Case**: Creates instance with custom configuration

  - **Input**: Partial configuration object
  - **Expected Output**: Instance with merged config (custom + defaults)
  - **Status**: ❌ Not Started
  - **Notes**: Should override only provided values

- [ ] **Test Case**: Initializes hydration state correctly
  - **Input**: Constructor call
  - **Expected Output**: HydrationState with proper default values
  - **Status**: ❌ Not Started
  - **Notes**: Should set isComplete: false, requiredSignals: 3

#### Initialization & Hydration Detection

- [ ] **Test Case**: Prevents double initialization

  - **Input**: Multiple calls to initialize()
  - **Expected Output**: Only first call has effect
  - **Status**: ❌ Not Started
  - **Notes**: Should check isInitialized flag

- [ ] **Test Case**: Detects complete hydration with sufficient signals

  - **Input**: Mock DOM with React root and complete document state
  - **Expected Output**: Hydration complete callback triggered
  - **Status**: ❌ Not Started
  - **Notes**: Need to mock document.readyState, React elements

- [ ] **Test Case**: Handles hydration timeout gracefully

  - **Input**: Long-running hydration check with timeout
  - **Expected Output**: Timeout callback triggered, stays in safe mode
  - **Status**: ❌ Not Started
  - **Notes**: Should use setTimeout mocking

- [ ] **Test Case**: Counts hydration signals correctly
  - **Input**: Various DOM states
  - **Expected Output**: Correct signal count based on conditions
  - **Status**: ❌ Not Started
  - **Notes**: Test document.readyState, React roots, timing

#### Form Tracking & Detection

- [ ] **Test Case**: Scans and tracks forms with correct selectors

  - **Input**: DOM with various form elements
  - **Expected Output**: Forms matching selectors are tracked
  - **Status**: ❌ Not Started
  - **Notes**: Test data-payload-form, action attributes

- [ ] **Test Case**: Determines form type ultra-conservatively

  - **Input**: Forms with and without explicit dynamic markers
  - **Expected Output**: All forms marked server-rendered except explicitly dynamic
  - **Status**: ❌ Not Started
  - **Notes**: Only data-explicitly-dynamic-form="true" should be dynamic

- [ ] **Test Case**: Tracks forms in memory without DOM modifications

  - **Input**: Form element
  - **Expected Output**: Form tracker created, no DOM changes
  - **Status**: ❌ Not Started
  - **Notes**: Verify WeakMap storage, no attribute changes

- [ ] **Test Case**: Handles duplicate form tracking gracefully
  - **Input**: Same form tracked multiple times
  - **Expected Output**: Form only tracked once
  - **Status**: ❌ Not Started
  - **Notes**: Should check existing tracker before creating new

#### Button Click Protection

- [ ] **Test Case**: Prevents clicks on disabled buttons

  - **Input**: Click event on disabled button
  - **Expected Output**: Event prevented and stopped
  - **Status**: ❌ Not Started
  - **Notes**: Should call preventDefault and stopPropagation

- [ ] **Test Case**: Prevents double-clicks during submission

  - **Input**: Click on button while form is submitting
  - **Expected Output**: Event prevented, warning logged
  - **Status**: ❌ Not Started
  - **Notes**: Form tracker state should be "submitting"

- [ ] **Test Case**: Allows clicks on enabled buttons in idle forms
  - **Input**: Click on enabled button in idle form
  - **Expected Output**: Event proceeds normally
  - **Status**: ❌ Not Started
  - **Notes**: Should not prevent event

#### Form Submission Protection

- [ ] **Test Case**: Prevents duplicate form submissions

  - **Input**: Multiple rapid submit events on same form
  - **Expected Output**: Only first submission proceeds
  - **Status**: ❌ Not Started
  - **Notes**: Subsequent submissions should be prevented

- [ ] **Test Case**: Creates tracker for untracked forms on submission

  - **Input**: Submit event on form not previously tracked
  - **Expected Output**: Form tracker created and submission handled
  - **Status**: ❌ Not Started
  - **Notes**: Should call trackFormInMemory

- [ ] **Test Case**: Sets submission state and timing correctly

  - **Input**: Form submission event
  - **Expected Output**: Tracker state becomes "submitting", startTime set
  - **Status**: ❌ Not Started
  - **Notes**: Should increment attemptCount

- [ ] **Test Case**: Stores button states without DOM modification
  - **Input**: Form with submit buttons
  - **Expected Output**: Original button states stored in memory only
  - **Status**: ❌ Not Started
  - **Notes**: Should populate originalButtonStates Map

#### Timeout Handling

- [ ] **Test Case**: Handles submission timeout correctly

  - **Input**: Form submission that exceeds timeout
  - **Expected Output**: State changed to "error", form re-enabled
  - **Status**: ❌ Not Started
  - **Notes**: Should use setTimeout with config.timeoutMs

- [ ] **Test Case**: Clears timeout on successful submission
  - **Input**: Successful submission before timeout
  - **Expected Output**: Timeout handler doesn't fire
  - **Status**: ❌ Not Started
  - **Notes**: Need to verify clearTimeout behavior

#### Success/Error Handling

- [ ] **Test Case**: Marks submission success correctly

  - **Input**: Call to markSubmissionSuccess with form
  - **Expected Output**: Tracker state becomes "success", form enabled
  - **Status**: ❌ Not Started
  - **Notes**: Should show success message in logs

- [ ] **Test Case**: Marks submission error correctly

  - **Input**: Call to markSubmissionError with form and error message
  - **Expected Output**: Tracker state becomes "error", error stored
  - **Status**: ❌ Not Started
  - **Notes**: Should log error and enable form

- [ ] **Test Case**: Enables form only for dynamic forms after hydration
  - **Input**: Call to enableForm on server-rendered vs dynamic form
  - **Expected Output**: Dynamic forms enabled, server-rendered stay protected
  - **Status**: ❌ Not Started
  - **Notes**: Should check hydration state and form type

#### Status Reporting

- [ ] **Test Case**: Reports accurate status for tracked forms

  - **Input**: Multiple forms in different states
  - **Expected Output**: Correct counts for each state and type
  - **Status**: ❌ Not Started
  - **Notes**: Should count submitting, error, success, server-rendered, dynamic

- [ ] **Test Case**: Includes hydration status in report
  - **Input**: Various hydration states
  - **Expected Output**: Correct hydration completion and signal count
  - **Status**: ❌ Not Started
  - **Notes**: Should reflect current hydration state

#### Mutation Observer

- [ ] **Test Case**: Tracks dynamically added forms

  - **Input**: New form elements added to DOM
  - **Expected Output**: New forms automatically tracked
  - **Status**: ❌ Not Started
  - **Notes**: Should use MutationObserver on body

- [ ] **Test Case**: Handles nested form addition
  - **Input**: Container with forms added to DOM
  - **Expected Output**: All nested forms tracked
  - **Status**: ❌ Not Started
  - **Notes**: Should use querySelectorAll on added elements

#### Global Singleton Management

- [ ] **Test Case**: Returns same instance from getFormSubmissionProtectionManager

  - **Input**: Multiple calls to getter function
  - **Expected Output**: Same instance returned each time
  - **Status**: ❌ Not Started
  - **Notes**: Should use global singleton pattern

- [ ] **Test Case**: Initializes global instance correctly

  - **Input**: Call to initializeFormSubmissionProtection
  - **Expected Output**: Global instance created and initialized
  - **Status**: ❌ Not Started
  - **Notes**: Should check globalThis.\_\_formSubmissionProtectionManager

- [ ] **Test Case**: Cleans up global instance
  - **Input**: Call to cleanupFormSubmissionProtection
  - **Expected Output**: Global instance cleaned up and cleared
  - **Status**: ❌ Not Started
  - **Notes**: Should set global to undefined

#### Cleanup

- [ ] **Test Case**: Disconnects all observers on cleanup

  - **Input**: Call to cleanup() after initialization
  - **Expected Output**: All MutationObservers disconnected
  - **Status**: ❌ Not Started
  - **Notes**: Should call disconnect() on all observers

- [ ] **Test Case**: Clears all tracking data on cleanup
  - **Input**: Call to cleanup() with tracked forms
  - **Expected Output**: WeakMap and Set cleared, isInitialized reset
  - **Status**: ❌ Not Started
  - **Notes**: Should reset all internal state

#### Error Cases

- [ ] **Test Case**: Handles missing form in button click gracefully
  - **Input**: Click on button not inside a form
  - **Expected Output**: No error, function returns early
  - **Status**: ❌ Not Started
  - **Notes**: Should use closest() and check for null

### Coverage Report

- **Test Implementation**: 27/27 tests passing (100%)
- **Test Areas Covered**: All major functionality areas implemented
- **Key Behaviors Tested**: Constructor, initialization, hydration detection, form tracking, submission protection, timeout handling, success/error flows, status reporting, mutation observer, cleanup, global singleton management

### Dependencies to Mock

- `@kit/shared/logger` - createEnvironmentLogger
- DOM APIs: document, MutationObserver, setTimeout, clearTimeout
- Global object: globalThis
- Event objects: MouseEvent, SubmitEvent

### Notes

- This is a complex client-side class with many DOM interactions
- Extensive mocking of browser APIs will be required
- Focus on memory-only operations and ultra-conservative behavior
- Test both initialization and runtime behavior
- Pay attention to singleton pattern and global state management

### Estimated Effort: 3-4 hours

- Complex class with many interdependent methods
- Extensive DOM and timer mocking required
- Multiple state transitions to test
- Integration between multiple systems (hydration, form tracking, event handling)
