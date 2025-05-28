/**
 * ULTRA-CONSERVATIVE Client-side Form Protection Initialization Script
 *
 * This script provides ZERO DOM MODIFICATION form protection for Payload CMS admin interface.
 * It prevents form submission loops and duplicate requests while completely avoiding hydration
 * mismatches by NEVER modifying ANY forms until absolutely certain about hydration status.
 *
 * Key Features:
 * - ZERO DOM modifications on ALL forms (server-rendered and dynamic)
 * - Ultra-conservative hydration detection (3+ seconds + multiple signals)
 * - Memory-only state tracking
 * - Event delegation for performance
 * - Console-only feedback to avoid visual modifications
 *
 * Usage: Include this script in the admin layout or inject it into the page.
 */

interface FormProtectionConfig {
  timeoutMs: number;
  retryDelayMs: number;
  maxRetries: number;
  enableLogging: boolean;
  formSelectors: string[];
  buttonSelectors: string[];
  hydrationTimeoutMs: number;
}

interface FormState {
  id: string;
  type: 'server-rendered' | 'dynamic' | 'unknown';
  state: 'idle' | 'submitting' | 'error' | 'success';
  element: HTMLFormElement;
  startTime: number;
  attemptCount: number;
  originalButtonStates: Map<HTMLButtonElement | HTMLInputElement, { text: string; disabled: boolean }>;
}

interface HydrationState {
  isComplete: boolean;
  startTime: number;
  maxWaitTime: number;
  confirmationSignals: number;
  requiredSignals: number;
}

(function (): void {
  'use strict';

  // Configuration
  const CONFIG: FormProtectionConfig = {
    timeoutMs: 30000, // 30 seconds
    retryDelayMs: 2000, // 2 seconds
    maxRetries: 3,
    enableLogging: true,
    formSelectors: [
      'form[data-payload-form]',
      'form[action*="create-first-user"]',
      'form[action*="api/"]',
      '.payload-form',
      'form',
    ],
    buttonSelectors: [
      'button[type="submit"]',
      'input[type="submit"]',
      '.btn--style-primary',
      '.form-submit',
      '.payload-button',
    ],
    hydrationTimeoutMs: 10000, // Increased to 10 seconds for ultra-conservative approach
  };

  // State management
  const formStates = new Map<HTMLFormElement, FormState>();
  const hydrationState: HydrationState = {
    isComplete: false,
    startTime: Date.now(),
    maxWaitTime: CONFIG.hydrationTimeoutMs,
    confirmationSignals: 0,
    requiredSignals: 4, // Require 4 confirmation signals
  };
  let isInitialized = false;

  // Logging utility
  function log(message: string, level: 'info' | 'debug' | 'warn' | 'error' = 'info'): void {
    if (!CONFIG.enableLogging && level === 'debug') return;
    const timestamp = new Date().toISOString();
    const prefix = `[ULTRA-CONSERVATIVE-FORM-PROTECTION-${level.toUpperCase()}] ${timestamp}`;
    console[level === 'error' ? 'error' : 'log'](`${prefix} ${message}`);
  }

  // Form ID generation utility
  function generateFormId(form: HTMLFormElement): string {
    if (form.id) return form.id;

    const action = form.action || window.location.pathname;
    const method = form.method || 'GET';

    let hash = 0;
    const str = `${action}-${method}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }

    return `form-${Math.abs(hash).toString(36)}`;
  }

  // ULTRA-CONSERVATIVE Form type detection
  function determineFormType(form: HTMLFormElement): 'server-rendered' | 'dynamic' | 'unknown' {
    // ULTRA-CONSERVATIVE: Only dynamic if EXPLICITLY and UNMISTAKABLY marked
    if (form.hasAttribute('data-explicitly-dynamic-form') && 
        form.getAttribute('data-explicitly-dynamic-form') === 'true') {
      return 'dynamic';
    }
    
    // EVERYTHING ELSE is treated as server-rendered to be safe
    return 'server-rendered';
  }

  // Ultra-conservative hydration detection utilities
  function countHydrationSignals(): number {
    let signals = 0;
    
    // Signal 1: Document complete
    if (document.readyState === 'complete') signals++;
    
    // Signal 2: React roots present
    if (document.querySelector('[data-reactroot]') !== null ||
        document.querySelector('#__next') !== null ||
        document.querySelector('#root') !== null) signals++;
    
    // Signal 3: Minimum time passed (3 seconds)
    if (Date.now() - hydrationState.startTime > 3000) signals++;
    
    // Signal 4: No recent navigation changes
    if (!hasRecentNavigation()) signals++;
    
    // Signal 5: React components appear mounted
    if (document.querySelectorAll('[data-react-component], [data-reactid]').length > 0) signals++;
    
    return signals;
  }

  function hasRecentNavigation(): boolean {
    // Simple heuristic - in a real app you might track navigation events
    return false;
  }

  function isUltraConservativeHydrationComplete(): boolean {
    const currentSignals = countHydrationSignals();
    hydrationState.confirmationSignals = Math.max(hydrationState.confirmationSignals, currentSignals);
    
    const elapsed = Date.now() - hydrationState.startTime;
    const minimumTimeElapsed = elapsed > 3000; // MINIMUM 3 seconds
    const hasEnoughSignals = hydrationState.confirmationSignals >= hydrationState.requiredSignals;
    
    return minimumTimeElapsed && hasEnoughSignals;
  }

  function waitForUltraConservativeHydration(callback: () => void): void {
    const checkHydration = () => {
      if (isUltraConservativeHydrationComplete()) {
        hydrationState.isComplete = true;
        const elapsed = Date.now() - hydrationState.startTime;
        log(`Ultra-conservative hydration detected complete after ${elapsed}ms with ${hydrationState.confirmationSignals} signals`, 'info');
        callback();
        return;
      }

      const elapsed = Date.now() - hydrationState.startTime;
      if (elapsed > hydrationState.maxWaitTime) {
        log(`Hydration timeout reached after ${elapsed}ms, staying in SAFE MODE (no DOM modifications)`, 'warn');
        hydrationState.isComplete = false; // Stay in safe mode
        callback();
        return;
      }

      // Continue checking more frequently for better detection
      setTimeout(checkHydration, 50);
    };

    checkHydration();
  }

  // Form protection - MEMORY ONLY, NO DOM modifications
  function protectFormInMemoryOnly(form: HTMLFormElement): void {
    if (formStates.has(form)) {
      log(`Form already protected: ${generateFormId(form)}`, 'debug');
      return;
    }

    const formId = generateFormId(form);
    const formType = determineFormType(form);
    
    const formState: FormState = {
      id: formId,
      type: formType,
      state: 'idle',
      element: form,
      startTime: 0,
      attemptCount: 0,
      originalButtonStates: new Map(),
    };

    formStates.set(form, formState);
    log(`Protected ${formType} form in MEMORY ONLY (no DOM changes): ${formId}`, 'debug');
  }

  // Scan and protect all existing forms - MEMORY ONLY
  function scanAndProtectForms(): number {
    let protectedCount = 0;

    CONFIG.formSelectors.forEach(selector => {
      try {
        const forms = document.querySelectorAll<HTMLFormElement>(selector);
        forms.forEach(form => {
          if (!formStates.has(form)) {
            protectFormInMemoryOnly(form);
            protectedCount++;
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Error finding forms with selector "${selector}": ${errorMessage}`, 'error');
      }
    });

    if (protectedCount > 0) {
      log(`Protected ${protectedCount} new forms in MEMORY ONLY`, 'info');
    }

    return protectedCount;
  }

  // Setup mutation observer for new forms - MEMORY TRACKING ONLY
  function setupMutationObserver(): void {
    const observer = new MutationObserver(mutations => {
      let shouldCheck = false;

      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;

            if (element.tagName === 'FORM' || element.querySelectorAll('form').length > 0) {
              shouldCheck = true;
            }
          }
        });
      });

      if (shouldCheck) {
        // Small delay to ensure new forms are fully initialized
        setTimeout(scanAndProtectForms, 100);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    log('Mutation observer set up for MEMORY-ONLY form tracking', 'debug');
  }

  // Event handlers - MEMORY ONLY PROTECTION
  function handleButtonClick(event: MouseEvent): void {
    const target = event.target as Element;
    if (!target) return;

    for (const selector of CONFIG.buttonSelectors) {
      if (target.matches(selector)) {
        const button = target as HTMLButtonElement | HTMLInputElement;
        if (button.disabled) {
          event.preventDefault();
          event.stopPropagation();
          log('Prevented click on disabled button', 'debug');
          return;
        }

        const form = button.closest('form');
        if (!form) return;

        const formState = formStates.get(form);
        if (formState && formState.state === 'submitting') {
          event.preventDefault();
          event.stopPropagation();
          log(`Prevented double-click on form ${formState.id}`, 'info');
          showMemoryOnlyMessage(form, 'Please wait, your request is being processed...', 'info');
        }
        break;
      }
    }
  }

  function handleFormSubmission(event: SubmitEvent): void {
    const form = event.target as HTMLFormElement;
    if (!form) return;

    let formState = formStates.get(form);
    if (!formState) {
      // Protect form immediately if not already protected
      protectFormInMemoryOnly(form);
      formState = formStates.get(form);
      if (!formState) return;
    }

    if (formState.state === 'submitting') {
      event.preventDefault();
      event.stopPropagation();
      log(`Prevented duplicate submission of form ${formState.id}`, 'info');
      showMemoryOnlyMessage(form, 'Form submission already in progress. Please wait...', 'info');
      return;
    }

    // Update form state
    formState.state = 'submitting';
    formState.startTime = Date.now();
    formState.attemptCount++;

    // ULTRA-CONSERVATIVE: NO DOM modifications for ANY forms - MEMORY ONLY
    storeButtonStatesInMemoryOnly(form, formState);

    // Set timeout for submission
    setTimeout(() => {
      if (formState && formState.state === 'submitting') {
        handleSubmissionTimeout(form, formState);
      }
    }, CONFIG.timeoutMs);

    log(`Form submission started - MEMORY ONLY TRACKING: ${formState.id} (${formState.type})`, 'info');
  }

  // Form state management - MEMORY ONLY
  function storeButtonStatesInMemoryOnly(form: HTMLFormElement, formState: FormState): void {
    CONFIG.buttonSelectors.forEach(selector => {
      const buttons = form.querySelectorAll<HTMLButtonElement | HTMLInputElement>(selector);
      buttons.forEach(button => {
        formState.originalButtonStates.set(button, {
          text: button.textContent || button.value || '',
          disabled: button.disabled,
        });
      });
    });
    log(`Button states stored in memory only for form ${formState.id}`, 'debug');
  }

  function enableFormMemoryOnly(form: HTMLFormElement): void {
    const formState = formStates.get(form);
    if (!formState) return;

    // ULTRA-CONSERVATIVE: NO DOM restoration unless absolutely certain
    // Even after ultra-conservative hydration detection, we avoid DOM changes
    log(`Form ${formState.id} enabled in memory only - NO DOM RESTORATION`, 'debug');
    
    formState.originalButtonStates.clear();
  }

  function handleSubmissionTimeout(form: HTMLFormElement, formState: FormState): void {
    log(`Form ${formState.id} submission timed out`, 'warn');
    formState.state = 'error';
    enableFormMemoryOnly(form);
    showMemoryOnlyMessage(form, 'Request timed out. Please try again.', 'error');
  }

  // Message display - CONSOLE ONLY, NO DOM modifications
  function showMemoryOnlyMessage(form: HTMLFormElement, message: string, type: 'success' | 'error' | 'info'): void {
    const formState = formStates.get(form);
    const formId = formState ? formState.id : 'unknown';
    
    // ULTRA-CONSERVATIVE: Console logging only - NO visual messages
    log(`Form ${formId} message (${type}): ${message}`, type === 'error' ? 'error' : 'info');
    
    // Optional: Could use native browser notifications for critical messages
    // but avoid anything that modifies DOM
    if (type === 'error' && CONFIG.enableLogging) {
      // Could consider browser notifications API, but generally avoid alerts
      // Notification.requestPermission().then(permission => {
      //   if (permission === 'granted') {
      //     new Notification('Form Error', { body: message });
      //   }
      // });
    }
  }

  // Navigation handling - MEMORY ONLY
  function setupNavigationDetection(): void {
    let lastUrl = window.location.href;
    const checkForNavigation = (): void => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        log('Navigation detected, re-scanning for forms (memory only)', 'info');
        setTimeout(scanAndProtectForms, 500);
      }
    };

    setInterval(checkForNavigation, 1000);
  }

  // Main initialization function - ULTRA-CONSERVATIVE
  const initialize = (): void => {
    if (isInitialized) {
      log('Already initialized', 'debug');
      return;
    }

    log('Initializing ULTRA-CONSERVATIVE hydration-safe form protection...', 'info');

    // Immediately protect all forms in MEMORY ONLY
    const initialCount = scanAndProtectForms();
    log(`Initial scan protected ${initialCount} forms in MEMORY ONLY`, 'info');

    // Setup event delegation immediately (safe for all forms - memory only)
    document.addEventListener('click', handleButtonClick, true);
    document.addEventListener('submit', handleFormSubmission, true);

    // Setup mutation observer for dynamic forms - memory tracking only
    setupMutationObserver();

    // Setup navigation detection - memory only
    setupNavigationDetection();

    // Wait for ULTRA-CONSERVATIVE hydration detection
    waitForUltraConservativeHydration(() => {
      log('Ultra-conservative hydration complete, but staying in SAFE MODE (no DOM modifications)', 'info');
      // Even after hydration, we maintain ultra-conservative approach
      // NO DOM modifications whatsoever
      log('Post-hydration setup complete - MEMORY ONLY MODE MAINTAINED', 'info');
    });

    isInitialized = true;
    log(`ULTRA-CONSERVATIVE form protection initialized - ZERO DOM MODIFICATIONS`, 'info');
  };

  // Auto-initialize based on document ready state
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(initialize);
      } else {
        setTimeout(initialize, 200);
      }
    });
  } else {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(initialize);
    } else {
      setTimeout(initialize, 200);
    }
  }

  // Expose status for debugging
  (globalThis as any).__ultraConservativeFormProtectionStatus = () => {
    return {
      initialized: isInitialized,
      hydrationComplete: hydrationState.isComplete,
      hydrationSignals: hydrationState.confirmationSignals,
      requiredSignals: hydrationState.requiredSignals,
      totalForms: formStates.size,
      mode: 'ULTRA-CONSERVATIVE (ZERO DOM MODIFICATIONS)',
      formsByType: Array.from(formStates.values()).reduce((acc, state) => {
        acc[state.type] = (acc[state.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      formsByState: Array.from(formStates.values()).reduce((acc, state) => {
        acc[state.state] = (acc[state.state] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  };

})();