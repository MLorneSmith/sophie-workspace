/**
 * Client-side Form Protection Initialization Script
 * 
 * This script should be included in the Payload admin interface to prevent
 * form submission loops and duplicate requests. It automatically detects and
 * protects forms, especially the create-first-user form.
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
}

interface FormState {
  id: string;
  state: 'idle' | 'submitting' | 'error';
  element: HTMLFormElement;
  startTime: number;
  attemptCount: number;
}

interface FormProtectionGlobal {
  getStatus: () => {
    initialized: boolean;
    trackedForms: number;
    forms: Array<{
      id: string;
      state: string;
      attemptCount: number;
    }>;
  };
  reinitialize: () => void;
  protectForm: (form: HTMLFormElement) => void;
  findForms: () => number;
}

(function(): void {
  'use strict';

  console.log('[FORM-PROTECTION] Initializing client-side form protection...');

  // Configuration
  const CONFIG: FormProtectionConfig = {
    timeoutMs: 30000, // 30 seconds
    retryDelayMs: 2000, // 2 seconds
    maxRetries: 3,
    enableLogging: true, // Always enable for debugging the current issue
    formSelectors: [
      'form[data-payload-form]',
      'form[action*="create-first-user"]',
      'form[action*="api/"]',
      '.payload-form',
      'form', // Catch-all for any form
    ],
    buttonSelectors: [
      'button[type="submit"]',
      'input[type="submit"]',
      '.btn--style-primary',
      '.form-submit',
      '.payload-button',
    ],
  };

  // State tracking
  const formStates = new Map<string, FormState>();
  let isInitialized = false;

  // Utility functions
  function log(message: string, level: 'info' | 'debug' | 'warn' | 'error' = 'info'): void {
    if (!CONFIG.enableLogging && level === 'debug') return;
    const timestamp = new Date().toISOString();
    const prefix = `[FORM-PROTECTION-${level.toUpperCase()}] ${timestamp}`;
    console[level === 'error' ? 'error' : 'log'](`${prefix} ${message}`);
  }

  function generateFormId(form: HTMLFormElement): string {
    if (form.id) return form.id;
    
    const action = form.action || window.location.pathname;
    const method = form.method || 'GET';
    
    // Simple hash function
    let hash = 0;
    const str = `${action}-${method}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return `form-${Math.abs(hash).toString(36)}`;
  }

  function createLoadingIndicator(): HTMLDivElement {
    const indicator = document.createElement('div');
    indicator.className = 'form-loading-indicator';
    indicator.style.cssText = `
      display: none;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    `;
    
    indicator.innerHTML = `
      <div style="
        width: 20px;
        height: 20px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #0073aa;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 10px;
      "></div>
      <div style="color: #666; font-size: 14px;">Processing request...</div>
      <div style="color: #999; font-size: 12px; margin-top: 5px;">Please wait, do not refresh</div>
    `;
    
    return indicator;
  }

  function addSpinnerAnimation(): void {
    if (document.getElementById('form-protection-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'form-protection-styles';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .form-protected {
        position: relative;
      }
      
      .form-submitting {
        pointer-events: none;
        opacity: 0.7;
      }
      
      .form-message {
        padding: 10px;
        margin: 10px 0;
        border-radius: 4px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      
      .form-message--success {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }
      
      .form-message--error {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }
      
      .form-message--info {
        background-color: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
      }
    `;
    
    document.head.appendChild(style);
  }

  function protectForm(form: HTMLFormElement): void {
    const formId = generateFormId(form);
    
    if (formStates.has(formId)) {
      log(`Form ${formId} already protected`, 'debug');
      return;
    }

    log(`Protecting form: ${formId}`, 'info');

    // Initialize form state
    formStates.set(formId, {
      id: formId,
      state: 'idle',
      element: form,
      startTime: 0,
      attemptCount: 0,
    });

    // Add protection attributes
    form.setAttribute('data-form-protected', 'true');
    form.setAttribute('data-form-id', formId);
    form.classList.add('form-protected');

    // Add loading indicator
    const indicator = createLoadingIndicator();
    form.style.position = 'relative';
    form.appendChild(indicator);

    // Add event listeners
    form.addEventListener('submit', handleFormSubmit, true);
    
    // Protect buttons in this form
    CONFIG.buttonSelectors.forEach(selector => {
      const buttons = form.querySelectorAll<HTMLButtonElement | HTMLInputElement>(selector);
      buttons.forEach(button => {
        button.addEventListener('click', handleButtonClick, true);
      });
    });
  }

  function handleButtonClick(event: Event): void {
    const button = event.target as HTMLButtonElement | HTMLInputElement;
    const form = button.closest('form') as HTMLFormElement | null;
    
    if (!form) return;
    
    const formId = form.getAttribute('data-form-id');
    if (!formId) return;
    
    const formState = formStates.get(formId);
    
    if (formState && formState.state === 'submitting') {
      event.preventDefault();
      event.stopPropagation();
      log(`Prevented double-click on form ${formId}`, 'info');
      showMessage(form, 'Please wait, your request is being processed...', 'info');
    }
  }

  function handleFormSubmit(event: Event): void {
    const form = event.target as HTMLFormElement;
    const formId = form.getAttribute('data-form-id');
    if (!formId) return;
    
    const formState = formStates.get(formId);
    
    if (!formState) {
      log(`Form ${formId} not in tracking state`, 'warn');
      return;
    }

    if (formState.state === 'submitting') {
      event.preventDefault();
      event.stopPropagation();
      log(`Prevented duplicate submission of form ${formId}`, 'info');
      showMessage(form, 'Form submission already in progress. Please wait...', 'info');
      return;
    }

    log(`Form ${formId} submission started`, 'info');

    // Update state
    formState.state = 'submitting';
    formState.startTime = Date.now();
    formState.attemptCount++;

    // Disable form
    disableForm(form);

    // Set timeout
    setTimeout(() => {
      if (formState.state === 'submitting') {
        handleSubmissionTimeout(form, formState);
      }
    }, CONFIG.timeoutMs);
  }

  function disableForm(form: HTMLFormElement): void {
    const formId = form.getAttribute('data-form-id');
    log(`Disabling form: ${formId}`, 'debug');
    
    // Add submitting class
    form.classList.add('form-submitting');
    
    // Disable all buttons
    CONFIG.buttonSelectors.forEach(selector => {
      const buttons = form.querySelectorAll<HTMLButtonElement | HTMLInputElement>(selector);
      buttons.forEach(button => {
        if (button.disabled) return; // Already disabled
        
        button.disabled = true;
        button.setAttribute('data-original-text', button.textContent || button.value || '');
        
        if (button.tagName === 'BUTTON') {
          button.textContent = 'Processing...';
        } else if (button.type === 'submit') {
          button.value = 'Processing...';
        }
      });
    });

    // Show loading indicator
    const indicator = form.querySelector<HTMLDivElement>('.form-loading-indicator');
    if (indicator) {
      indicator.style.display = 'block';
    }
  }

  function enableForm(form: HTMLFormElement): void {
    const formId = form.getAttribute('data-form-id');
    log(`Enabling form: ${formId}`, 'debug');
    
    // Remove submitting class
    form.classList.remove('form-submitting');
    
    // Re-enable all buttons
    CONFIG.buttonSelectors.forEach(selector => {
      const buttons = form.querySelectorAll<HTMLButtonElement | HTMLInputElement>(selector);
      buttons.forEach(button => {
        button.disabled = false;
        
        const originalText = button.getAttribute('data-original-text');
        if (originalText) {
          if (button.tagName === 'BUTTON') {
            button.textContent = originalText;
          } else if (button.type === 'submit') {
            button.value = originalText;
          }
          button.removeAttribute('data-original-text');
        }
      });
    });

    // Hide loading indicator
    const indicator = form.querySelector<HTMLDivElement>('.form-loading-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }

  function handleSubmissionTimeout(form: HTMLFormElement, formState: FormState): void {
    log(`Form ${formState.id} submission timed out`, 'warn');
    
    formState.state = 'error';
    enableForm(form);
    showMessage(form, 'Request timed out. Please try again.', 'error');
  }

  function showMessage(form: HTMLFormElement, message: string, type: 'success' | 'error' | 'info'): void {
    // Remove existing messages
    const existingMessages = form.querySelectorAll<HTMLDivElement>('.form-message');
    existingMessages.forEach(msg => msg.remove());

    // Create new message
    const messageElement = document.createElement('div');
    messageElement.className = `form-message form-message--${type}`;
    messageElement.textContent = message;
    
    // Insert at the top of the form
    form.insertBefore(messageElement, form.firstChild);

    // Auto-remove after delay
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.remove();
      }
    }, 5000);
  }

  function findAndProtectForms(): number {
    let protectedCount = 0;
    
    CONFIG.formSelectors.forEach(selector => {
      try {
        const forms = document.querySelectorAll<HTMLFormElement>(selector);
        forms.forEach(form => {
          if (form.tagName === 'FORM' && !form.hasAttribute('data-form-protected')) {
            protectForm(form);
            protectedCount++;
          }
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Error finding forms with selector "${selector}": ${errorMessage}`, 'error');
      }
    });
    
    if (protectedCount > 0) {
      log(`Protected ${protectedCount} new forms`, 'info');
    }
    
    return protectedCount;
  }

  function setupMutationObserver(): void {
    const observer = new MutationObserver((mutations) => {
      let shouldCheck = false;
      
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Check if the added node is a form or contains forms
            if (element.tagName === 'FORM' || element.querySelectorAll('form').length > 0) {
              shouldCheck = true;
            }
          }
        });
      });
      
      if (shouldCheck) {
        // Debounce to avoid excessive checks
        setTimeout(findAndProtectForms, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    log('Mutation observer set up for dynamic forms', 'debug');
  }

  function initialize(): void {
    if (isInitialized) {
      log('Already initialized', 'debug');
      return;
    }

    log('Initializing form protection...', 'info');

    // Add styles
    addSpinnerAnimation();

    // Protect existing forms
    const initialCount = findAndProtectForms();
    
    // Set up observer for dynamic content
    setupMutationObserver();
    
    // Monitor for navigation changes (SPA behavior)
    let lastUrl = window.location.href;
    const checkForNavigation = (): void => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        log('Navigation detected, re-scanning for forms', 'info');
        setTimeout(findAndProtectForms, 500);
      }
    };
    
    setInterval(checkForNavigation, 1000);

    isInitialized = true;
    log(`Form protection initialized. Protected ${initialCount} forms initially.`, 'info');
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    // DOM is already ready, initialize immediately
    setTimeout(initialize, 100);
  }

  // Also try to initialize after a short delay to catch any late-loading content
  setTimeout(initialize, 1000);

  // Expose global functions for debugging using type assertion
  (window as any).formProtection = {
    getStatus: () => ({
      initialized: isInitialized,
      trackedForms: formStates.size,
      forms: Array.from(formStates.values()).map(state => ({
        id: state.id,
        state: state.state,
        attemptCount: state.attemptCount,
      })),
    }),
    reinitialize: () => {
      isInitialized = false;
      initialize();
    },
    protectForm: protectForm,
    findForms: findAndProtectForms,
  } as FormProtectionGlobal;

  log('Form protection script loaded', 'info');
})();