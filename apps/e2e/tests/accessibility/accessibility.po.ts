import { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility Page Object Model
 * 
 * Provides reusable methods for accessibility testing across the application.
 * Configures axe-core for WCAG 2.1 AA compliance testing.
 */
export class AccessibilityPO {
  constructor(private page: Page) {}

  /**
   * Run full WCAG 2.1 AA compliance scan
   */
  async runFullAccessibilityScan() {
    return await new AxeBuilder({ page: this.page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
  }

  /**
   * Run specific accessibility rule checks
   */
  async runSpecificRules(rules: string[]) {
    return await new AxeBuilder({ page: this.page })
      .withRules(rules)
      .analyze();
  }

  /**
   * Test color contrast compliance
   */
  async testColorContrast() {
    return await this.runSpecificRules(['color-contrast']);
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation() {
    return await this.runSpecificRules([
      'keyboard',
      'focus-order-semantics',
      'tabindex'
    ]);
  }

  /**
   * Test screen reader compatibility
   */
  async testScreenReaderCompatibility() {
    return await this.runSpecificRules([
      'aria-allowed-attr',
      'aria-required-attr', 
      'aria-valid-attr-value',
      'aria-valid-attr',
      'button-name',
      'input-button-name',
      'label',
      'link-name',
      'image-alt'
    ]);
  }

  /**
   * Test form accessibility
   */
  async testFormAccessibility() {
    return await this.runSpecificRules([
      'label',
      'form-field-multiple-labels',
      'aria-required-attr',
      'button-name',
      'input-button-name'
    ]);
  }

  /**
   * Test landmark and heading structure
   */
  async testLandmarksAndHeadings() {
    return await this.runSpecificRules([
      'landmark-banner-is-top-level',
      'landmark-main-is-top-level',
      'landmark-no-duplicate-banner',
      'landmark-no-duplicate-contentinfo',
      'landmark-no-duplicate-main',
      'landmark-one-main',
      'region',
      'heading-order',
      'page-has-heading-one'
    ]);
  }

  /**
   * Test image accessibility
   */
  async testImageAccessibility() {
    return await this.runSpecificRules([
      'image-alt',
      'image-redundant-alt',
      'object-alt'
    ]);
  }

  /**
   * Navigate to page and wait for stability
   */
  async navigateAndWait(url: string) {
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
    // Additional wait to ensure dynamic content has loaded
    await this.page.waitForTimeout(1000);
  }

  /**
   * Test page with authentication (requires valid session)
   */
  async testAuthenticatedPage(url: string) {
    await this.navigateAndWait(url);
    
    // Check if we were redirected to auth page
    if (this.page.url().includes('/auth/')) {
      throw new Error(`Authentication required for ${url}. Test skipped.`);
    }
    
    return await this.runFullAccessibilityScan();
  }

  /**
   * Generate detailed accessibility report
   */
  generateReport(results: any) {
    const report = {
      url: this.page.url(),
      violations: results.violations.length,
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      inapplicable: results.inapplicable.length,
      violationDetails: results.violations.map((violation: any) => ({
        id: violation.id,
        impact: violation.impact,
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        tags: violation.tags,
        nodes: violation.nodes.length,
        nodeDetails: violation.nodes.map((node: any) => ({
          target: node.target,
          html: node.html,
          impact: node.impact,
          failureSummary: node.failureSummary
        }))
      }))
    };

    return report;
  }

  /**
   * Print accessibility results to console
   */
  printResults(results: any, testName: string) {
    console.log(`\n=== ${testName} ===`);
    console.log(`URL: ${this.page.url()}`);
    console.log(`Violations: ${results.violations.length}`);
    console.log(`Passes: ${results.passes.length}`);
    console.log(`Incomplete: ${results.incomplete.length}`);
    console.log(`Inapplicable: ${results.inapplicable.length}`);

    if (results.violations.length > 0) {
      console.log('\n🚨 VIOLATIONS FOUND:');
      results.violations.forEach((violation: any, index: number) => {
        console.log(`\n${index + 1}. ${violation.id} (Impact: ${violation.impact})`);
        console.log(`   Description: ${violation.description}`);
        console.log(`   Help: ${violation.help}`);
        console.log(`   Help URL: ${violation.helpUrl}`);
        console.log(`   Affected elements: ${violation.nodes.length}`);
        
        // Show first few affected elements
        violation.nodes.slice(0, 3).forEach((node: any, nodeIndex: number) => {
          console.log(`   Element ${nodeIndex + 1}: ${node.target.join(', ')}`);
        });
        
        if (violation.nodes.length > 3) {
          console.log(`   ... and ${violation.nodes.length - 3} more elements`);
        }
      });
    } else {
      console.log('✅ No violations found!');
    }
    console.log('================================\n');
  }

  /**
   * Test critical accessibility issues only (blockers)
   */
  async testCriticalAccessibility() {
    return await new AxeBuilder({ page: this.page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .include('main')
      .exclude('[role="presentation"]')
      .disableRules(['color-contrast']) // Focus on critical structural issues first
      .analyze();
  }

  /**
   * Test focus management
   */
  async testFocusManagement() {
    // Test keyboard navigation through interactive elements
    const results = await this.runSpecificRules([
      'focus-order-semantics',
      'tabindex'
    ]);

    // Manual focus testing
    const interactiveElements = await this.page.locator('button, a, input, select, textarea, [tabindex]').all();
    
    for (const element of interactiveElements.slice(0, 10)) { // Test first 10 elements
      try {
        await element.focus();
        const isFocused = await element.evaluate(el => document.activeElement === el);
        if (!isFocused) {
          console.warn('Element cannot receive focus:', await element.getAttribute('class'));
        }
      } catch (error) {
        console.warn('Focus test error:', error.message);
      }
    }

    return results;
  }
}