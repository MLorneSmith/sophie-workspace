// @ts-nocheck
(function() {
  'use strict';
  
  console.log('[FORM-PROTECTION] Initializing form submission protection...');
  
  // Configuration
  const CONFIG = {
    timeoutMs: 30000, // 30 seconds
    enableLogging: true,
    formSelectors: [
      'form[action*="create-first-user"]',
      'form[data-payload-form]',
      'form[action*="api/"]',
      '.payload-form',
      'form'
    ],
    buttonSelectors: [
      'button[type="submit"]',
      'input[type="submit"]',
      '.btn--style-primary',
      '.form-submit'
    ]
  };
  
  // State tracking
  const formStates = new Map();
  let isInitialized = false;
  
  function log(message, level) {
    if (!CONFIG.enableLogging && level === 'debug') return;
    const timestamp = new Date().toISOString();
    console.log('[FORM-PROTECTION-' + (level || 'INFO').toUpperCase() + '] ' + timestamp + ' ' + message);
  }
  
  function generateFormId(form) {
    if (form.id) return form.id;
    
    const action = form.action || window.location.pathname;
    const method = form.method || 'GET';
    
    // Simple hash
    let hash = 0;
    const str = action + '-' + method;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return 'form-' + Math.abs(hash).toString(36);
  }
  
  function addStyles() {
    if (document.getElementById('form-protection-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'form-protection-styles';
    style.textContent = `
      @keyframes form-protection-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .form-protection-loading {
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
        z-index: 10000;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      
      .form-protection-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #0073aa;
        border-radius: 50%;
        animation: form-protection-spin 1s linear infinite;
        margin: 0 auto 10px;
      }
      
      .form-protection-submitting {
        position: relative;
        pointer-events: none;
        opacity: 0.7;
      }
      
      .form-protection-message {
        padding: 10px;
        margin: 10px 0;
        border-radius: 4px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 14px;
      }
      
      .form-protection-message--error {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }
      
      .form-protection-message--info {
        background-color: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
      }
    `;
    
    document.head.appendChild(style);
  }
  
  function createLoadingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'form-protection-loading';
    indicator.innerHTML = `
      <div class="form-protection-spinner"></div>
      <div style="color: #666; font-size: 14px;">Processing request...</div>
      <div style="color: #999; font-size: 12px; margin-top: 5px;">Please wait, do not refresh</div>
    `;
    return indicator;
  }
  
  function showMessage(form, message, type) {
    // Remove existing messages
    const existingMessages = form.querySelectorAll('.form-protection-message');
    for (let i = 0; i < existingMessages.length; i++) {
      existingMessages[i].remove();
    }
    
    // Create new message
    const messageElement = document.createElement('div');
    messageElement.className = 'form-protection-message form-protection-message--' + type;
    messageElement.textContent = message;
    
    // Insert at the top of the form
    form.insertBefore(messageElement, form.firstChild);
    
    // Auto-remove after delay
    setTimeout(function() {
      if (messageElement.parentNode) {
        messageElement.remove();
      }
    }, 5000);
  }
  
  function protectForm(form) {
    const formId = generateFormId(form);
    
    if (formStates.has(formId)) {
      return; // Already protected
    }
    
    log('Protecting form: ' + formId, 'info');
    
    // Initialize form state
    formStates.set(formId, {
      id: formId,
      submitting: false,
      element: form,
      startTime: 0
    });
    
    // Add attributes
    form.setAttribute('data-form-protected', 'true');
    form.setAttribute('data-form-id', formId);
    
    // Make form relative for positioning
    if (window.getComputedStyle(form).position === 'static') {
      form.style.position = 'relative';
    }
    
    // Add loading indicator
    const indicator = createLoadingIndicator();
    form.appendChild(indicator);
    
    // Add submit handler
    form.addEventListener('submit', function(event) {
      const formState = formStates.get(formId);
      
      if (formState.submitting) {
        event.preventDefault();
        event.stopPropagation();
        log('Prevented duplicate submission of form ' + formId, 'info');
        showMessage(form, 'Form submission already in progress. Please wait...', 'info');
        return false;
      }
      
      log('Form ' + formId + ' submission started', 'info');
      
      // Update state
      formState.submitting = true;
      formState.startTime = Date.now();
      
      // Disable form
      disableForm(form, formState);
      
      // Set timeout
      setTimeout(function() {
        if (formState.submitting) {
          handleTimeout(form, formState);
        }
      }, CONFIG.timeoutMs);
    });
    
    // Add button click protection
    const buttons = form.querySelectorAll(CONFIG.buttonSelectors.join(', '));
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', function(event) {
        const formState = formStates.get(formId);
        
        if (formState && formState.submitting) {
          event.preventDefault();
          event.stopPropagation();
          log('Prevented double-click on form ' + formId, 'info');
          showMessage(form, 'Please wait, your request is being processed...', 'info');
          return false;
        }
      });
    }
  }
  
  function disableForm(form, formState) {
    log('Disabling form: ' + formState.id, 'debug');
    
    // Add submitting class
    form.classList.add('form-protection-submitting');
    
    // Disable all buttons
    const buttons = form.querySelectorAll(CONFIG.buttonSelectors.join(', '));
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      if (button.disabled) continue;
      
      button.disabled = true;
      button.setAttribute('data-original-text', button.textContent || button.value || '');
      
      if (button.tagName === 'BUTTON') {
        button.textContent = 'Processing...';
      } else if (button.type === 'submit') {
        button.value = 'Processing...';
      }
    }
    
    // Show loading indicator
    const indicator = form.querySelector('.form-protection-loading');
    if (indicator) {
      indicator.style.display = 'block';
    }
  }
  
  function enableForm(form, formState) {
    log('Enabling form: ' + formState.id, 'debug');
    
    // Remove submitting class
    form.classList.remove('form-protection-submitting');
    
    // Re-enable all buttons
    const buttons = form.querySelectorAll(CONFIG.buttonSelectors.join(', '));
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
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
    }
    
    // Hide loading indicator
    const indicator = form.querySelector('.form-protection-loading');
    if (indicator) {
      indicator.style.display = 'none';
    }
    
    // Reset state
    formState.submitting = false;
  }
  
  function handleTimeout(form, formState) {
    log('Form ' + formState.id + ' submission timed out', 'warn');
    
    enableForm(form, formState);
    showMessage(form, 'Request timed out. Please try again.', 'error');
  }
  
  function findAndProtectForms() {
    let protectedCount = 0;
    
    for (let i = 0; i < CONFIG.formSelectors.length; i++) {
      const selector = CONFIG.formSelectors[i];
      try {
        const forms = document.querySelectorAll(selector);
        for (let j = 0; j < forms.length; j++) {
          const form = forms[j];
          if (form.tagName === 'FORM' && !form.hasAttribute('data-form-protected')) {
            protectForm(form);
            protectedCount++;
          }
        }
      } catch (error) {
        log('Error finding forms with selector "' + selector + '": ' + error.message, 'error');
      }
    }
    
    if (protectedCount > 0) {
      log('Protected ' + protectedCount + ' new forms', 'info');
    }
    
    return protectedCount;
  }
  
  function setupMutationObserver() {
    if (!window.MutationObserver) {
      log('MutationObserver not supported, falling back to periodic scanning', 'warn');
      setInterval(findAndProtectForms, 2000);
      return;
    }
    
    const observer = new MutationObserver(function(mutations) {
      let shouldCheck = false;
      
      for (let i = 0; i < mutations.length; i++) {
        const mutation = mutations[i];
        for (let j = 0; j < mutation.addedNodes.length; j++) {
          const node = mutation.addedNodes[j];
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === 'FORM' || node.querySelectorAll('form').length > 0) {
              shouldCheck = true;
              break;
            }
          }
        }
        if (shouldCheck) break;
      }
      
      if (shouldCheck) {
        setTimeout(findAndProtectForms, 100);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    log('Mutation observer set up for dynamic forms', 'debug');
  }
  
  function initialize() {
    if (isInitialized) {
      return;
    }
    
    log('Initializing form protection...', 'info');
    
    // Add styles
    addStyles();
    
    // Protect existing forms
    const initialCount = findAndProtectForms();
    
    // Set up observer for dynamic content
    setupMutationObserver();
    
    // Monitor for navigation changes
    let lastUrl = window.location.href;
    setInterval(function() {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        log('Navigation detected, re-scanning for forms', 'info');
        setTimeout(findAndProtectForms, 500);
      }
    }, 1000);
    
    isInitialized = true;
    log('Form protection initialized. Protected ' + initialCount + ' forms initially.', 'info');
  }
  
  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    setTimeout(initialize, 100);
  }
  
  // Also try after a delay for late-loading content
  setTimeout(initialize, 1000);
  
  // Expose global functions for debugging
  window.formProtection = {
    getStatus: function() {
      const forms = [];
      formStates.forEach(function(state) {
        forms.push({
          id: state.id,
          submitting: state.submitting,
          startTime: state.startTime
        });
      });
      
      return {
        initialized: isInitialized,
        trackedForms: formStates.size,
        forms: forms
      };
    },
    reinitialize: function() {
      isInitialized = false;
      initialize();
    },
    scanForForms: findAndProtectForms
  };
  
  log('Form protection script loaded and ready', 'info');
})();