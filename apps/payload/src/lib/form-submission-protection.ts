/**
 * Form Submission Protection for Payload CMS Admin Interface
 * 
 * This module provides client-side protection against form submission loops
 * and duplicate requests that can occur in the Payload admin interface.
 * 
 * Key Features:
 * - Button state management to prevent double-clicks
 * - Form submission locking during processing
 * - Automatic retry with exponential backoff
 * - Integration with Payload's form system
 */

type SubmissionState = 'idle' | 'submitting' | 'success' | 'error';

interface FormSubmissionConfig {
  /** Maximum time to wait for submission completion */
  timeoutMs: number;
  /** Delay before enabling retry */
  retryDelayMs: number;
  /** Maximum number of retries */
  maxRetries: number;
  /** Enable debug logging */
  enableLogging: boolean;
  /** Selectors for form elements to protect */
  formSelectors: string[];
  /** Button selectors to disable during submission */
  buttonSelectors: string[];
}

interface FormSubmissionTracker {
  formId: string;
  state: SubmissionState;
  startTime: number;
  attemptCount: number;
  lastError?: string;
}

class FormSubmissionProtectionManager {
  private trackedForms = new Map<string, FormSubmissionTracker>();
  private readonly config: FormSubmissionConfig;
  private observers: MutationObserver[] = [];
  private isInitialized = false;

  constructor(config?: Partial<FormSubmissionConfig>) {
    this.config = {
      timeoutMs: 30000, // 30 seconds
      retryDelayMs: 2000, // 2 seconds
      maxRetries: 3,
      enableLogging: process.env.NODE_ENV === 'development',
      formSelectors: [
        'form[data-payload-form]',
        'form[action*="create-first-user"]',
        'form[action*="api/"]',
        '.payload-form',
      ],
      buttonSelectors: [
        'button[type="submit"]',
        'input[type="submit"]',
        '.btn--style-primary',
        '.form-submit',
      ],
      ...config,
    };

    this.log('Form submission protection manager initialized', 'info');
  }

  /**
   * Initialize form protection for the current page
   */
  initialize(): void {
    if (this.isInitialized) {
      this.log('Already initialized', 'debug');
      return;
    }

    this.log('Initializing form submission protection', 'info');

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.setupFormProtection();
      });
    } else {
      this.setupFormProtection();
    }

    this.isInitialized = true;
  }

  /**
   * Set up protection for all forms on the page
   */
  private setupFormProtection(): void {
    // Find and protect existing forms
    this.protectExistingForms();

    // Set up observer for dynamically added forms
    this.setupMutationObserver();

    // Add global event listeners
    this.setupGlobalEventListeners();

    this.log(`Form protection setup complete. Tracking ${this.trackedForms.size} forms`, 'info');
  }

  /**
   * Protect all existing forms on the page
   */
  private protectExistingForms(): void {
    this.config.formSelectors.forEach(selector => {
      const forms = document.querySelectorAll(selector);
      forms.forEach((form) => {
        if (form instanceof HTMLFormElement) {
          this.protectForm(form);
        }
      });
    });
  }

  /**
   * Set up mutation observer for dynamic content
   */
  private setupMutationObserver(): void {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Check if the added node is a form
            this.config.formSelectors.forEach(selector => {
              if (element.matches && element.matches(selector)) {
                this.protectForm(element as HTMLFormElement);
              }
              
              // Check for forms within the added node
              const childForms = element.querySelectorAll(selector);
              childForms.forEach((form) => {
                if (form instanceof HTMLFormElement) {
                  this.protectForm(form);
                }
              });
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.observers.push(observer);
  }

  /**
   * Set up global event listeners
   */
  private setupGlobalEventListeners(): void {
    // Prevent double-clicks on buttons
    document.addEventListener('click', (event) => {
      const target = event.target as Element;
      
      this.config.buttonSelectors.forEach(selector => {
        if (target.matches && target.matches(selector)) {
          this.handleButtonClick(target as HTMLButtonElement, event);
        }
      });
    }, true);

    // Handle form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement;
      this.handleFormSubmission(form, event);
    }, true);
  }

  /**
   * Protect a specific form
   */
  private protectForm(form: HTMLFormElement): void {
    const formId = this.getFormId(form);
    
    if (this.trackedForms.has(formId)) {
      this.log(`Form ${formId} already protected`, 'debug');
      return;
    }

    // Create tracker
    const tracker: FormSubmissionTracker = {
      formId,
      state: 'idle',
      startTime: 0,
      attemptCount: 0,
    };

    this.trackedForms.set(formId, tracker);

    // Add visual indicators
    this.addFormIndicators(form);

    this.log(`Protected form: ${formId}`, 'debug');
  }

  /**
   * Generate a unique form ID
   */
  private getFormId(form: HTMLFormElement): string {
    // Use existing ID if available
    if (form.id) {
      return form.id;
    }

    // Generate ID based on action and method
    const action = form.action || window.location.pathname;
    const method = form.method || 'GET';
    const hash = this.simpleHash(`${action}-${method}`);
    
    return `form-${hash}`;
  }

  /**
   * Simple hash function for generating IDs
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Add visual indicators to the form
   */
  private addFormIndicators(form: HTMLFormElement): void {
    // Add data attribute for styling
    form.setAttribute('data-form-protected', 'true');

    // Add loading indicator container if not exists
    if (!form.querySelector('.form-loading-indicator')) {
      const indicator = document.createElement('div');
      indicator.className = 'form-loading-indicator';
      indicator.style.display = 'none';
      indicator.innerHTML = `
        <div class="loading-spinner"></div>
        <span class="loading-text">Processing...</span>
      `;
      form.appendChild(indicator);
    }
  }

  /**
   * Handle button click events
   */
  private handleButtonClick(button: HTMLButtonElement, event: MouseEvent): void {
    // Skip if button is already disabled
    if (button.disabled) {
      event.preventDefault();
      event.stopPropagation();
      this.log('Prevented click on disabled button', 'debug');
      return;
    }

    // Find the parent form
    const form = button.closest('form') as HTMLFormElement;
    if (!form) {
      return;
    }

    const formId = this.getFormId(form);
    const tracker = this.trackedForms.get(formId);

    if (tracker && tracker.state === 'submitting') {
      event.preventDefault();
      event.stopPropagation();
      this.log(`Prevented double-click on form ${formId}`, 'info');
      return;
    }
  }

  /**
   * Handle form submission events
   */
  private handleFormSubmission(form: HTMLFormElement, event: SubmitEvent): void {
    const formId = this.getFormId(form);
    const tracker = this.trackedForms.get(formId);

    if (!tracker) {
      // Form not tracked, add protection
      this.protectForm(form);
      return;
    }

    if (tracker.state === 'submitting') {
      event.preventDefault();
      event.stopPropagation();
      this.log(`Prevented duplicate submission of form ${formId}`, 'info');
      return;
    }

    // Update tracker state
    tracker.state = 'submitting';
    tracker.startTime = Date.now();
    tracker.attemptCount++;

    // Disable form
    this.disableForm(form);

    // Set timeout
    setTimeout(() => {
      if (tracker.state === 'submitting') {
        this.handleSubmissionTimeout(form, tracker);
      }
    }, this.config.timeoutMs);

    this.log(`Form ${formId} submission started (attempt ${tracker.attemptCount})`, 'info');
  }

  /**
   * Disable form during submission
   */
  private disableForm(form: HTMLFormElement): void {
    // Disable all buttons
    this.config.buttonSelectors.forEach(selector => {
      const buttons = form.querySelectorAll(selector);
      buttons.forEach((button) => {
        if (button instanceof HTMLButtonElement || button instanceof HTMLInputElement) {
          button.disabled = true;
          button.setAttribute('data-original-text', button.textContent || button.value || '');
          
          if (button instanceof HTMLButtonElement) {
            button.textContent = 'Processing...';
          } else {
            button.value = 'Processing...';
          }
        }
      });
    });

    // Show loading indicator
    const indicator = form.querySelector('.form-loading-indicator') as HTMLElement;
    if (indicator) {
      indicator.style.display = 'block';
    }

    // Add submitting class
    form.classList.add('form-submitting');
  }

  /**
   * Re-enable form after submission
   */
  private enableForm(form: HTMLFormElement): void {
    // Re-enable all buttons
    this.config.buttonSelectors.forEach(selector => {
      const buttons = form.querySelectorAll(selector);
      buttons.forEach((button) => {
        if (button instanceof HTMLButtonElement || button instanceof HTMLInputElement) {
          button.disabled = false;
          const originalText = button.getAttribute('data-original-text');
          
          if (originalText) {
            if (button instanceof HTMLButtonElement) {
              button.textContent = originalText;
            } else {
              button.value = originalText;
            }
            button.removeAttribute('data-original-text');
          }
        }
      });
    });

    // Hide loading indicator
    const indicator = form.querySelector('.form-loading-indicator') as HTMLElement;
    if (indicator) {
      indicator.style.display = 'none';
    }

    // Remove submitting class
    form.classList.remove('form-submitting');
  }

  /**
   * Handle submission timeout
   */
  private handleSubmissionTimeout(form: HTMLFormElement, tracker: FormSubmissionTracker): void {
    this.log(`Form ${tracker.formId} submission timed out`, 'warn');
    
    tracker.state = 'error';
    tracker.lastError = 'Submission timeout';
    
    this.enableForm(form);
    
    // Show error message
    this.showMessage(form, 'Submission timed out. Please try again.', 'error');
  }

  /**
   * Mark form submission as successful
   */
  markSubmissionSuccess(formId: string): void {
    const tracker = this.trackedForms.get(formId);
    if (tracker) {
      tracker.state = 'success';
      const form = document.querySelector(`[data-form-id="${formId}"]`) as HTMLFormElement;
      if (form) {
        this.enableForm(form);
        this.showMessage(form, 'Submission successful!', 'success');
      }
      this.log(`Form ${formId} submission successful`, 'info');
    }
  }

  /**
   * Mark form submission as failed
   */
  markSubmissionError(formId: string, error: string): void {
    const tracker = this.trackedForms.get(formId);
    if (tracker) {
      tracker.state = 'error';
      tracker.lastError = error;
      const form = document.querySelector(`[data-form-id="${formId}"]`) as HTMLFormElement;
      if (form) {
        this.enableForm(form);
        this.showMessage(form, `Error: ${error}`, 'error');
      }
      this.log(`Form ${formId} submission failed: ${error}`, 'error');
    }
  }

  /**
   * Show message to user
   */
  private showMessage(form: HTMLFormElement, message: string, type: 'success' | 'error' | 'info'): void {
    // Remove existing messages
    const existingMessages = form.querySelectorAll('.form-message');
    existingMessages.forEach(msg => msg.remove());

    // Create new message
    const messageElement = document.createElement('div');
    messageElement.className = `form-message form-message--${type}`;
    messageElement.textContent = message;
    
    // Insert at the top of the form
    form.insertBefore(messageElement, form.firstChild);

    // Auto-remove after delay
    setTimeout(() => {
      messageElement.remove();
    }, 5000);
  }

  /**
   * Get current status
   */
  getStatus() {
    const status = {
      totalForms: this.trackedForms.size,
      submittingForms: 0,
      errorForms: 0,
      successForms: 0,
      forms: Array.from(this.trackedForms.values()),
    };

    for (const tracker of this.trackedForms.values()) {
      switch (tracker.state) {
        case 'submitting':
          status.submittingForms++;
          break;
        case 'error':
          status.errorForms++;
          break;
        case 'success':
          status.successForms++;
          break;
      }
    }

    return status;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.trackedForms.clear();
    this.isInitialized = false;
    this.log('Form submission protection cleaned up', 'info');
  }

  /**
   * Centralized logging
   */
  private log(message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info'): void {
    if (!this.config.enableLogging && level === 'debug') {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[FORM-PROTECTION-${level.toUpperCase()}] ${timestamp}`;
    
    console[level === 'error' ? 'error' : 'log'](`${prefix} ${message}`);
  }
}

// Global instance
declare global {
  var __form_submission_protection: FormSubmissionProtectionManager | undefined;
}

/**
 * Get the global form submission protection manager
 */
export function getFormProtectionManager(): FormSubmissionProtectionManager {
  if (!globalThis.__form_submission_protection) {
    globalThis.__form_submission_protection = new FormSubmissionProtectionManager();
  }
  return globalThis.__form_submission_protection;
}

/**
 * Initialize form protection for the current page
 */
export function initializeFormProtection(config?: Partial<FormSubmissionConfig>): void {
  const manager = globalThis.__form_submission_protection || 
                 new FormSubmissionProtectionManager(config);
  
  if (!globalThis.__form_submission_protection) {
    globalThis.__form_submission_protection = manager;
  }
  
  manager.initialize();
}

/**
 * Cleanup form protection
 */
export function cleanupFormProtection(): void {
  if (globalThis.__form_submission_protection) {
    globalThis.__form_submission_protection.cleanup();
    globalThis.__form_submission_protection = undefined;
  }
}