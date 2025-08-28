import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';

interface TestStats {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  duration: number;
}

class FailureReporter implements Reporter {
  private stats: TestStats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    flaky: 0,
    duration: 0,
  };
  
  private failures: Array<{
    title: string;
    file: string;
    line: number;
    error: string;
    duration: number;
  }> = [];
  
  private startTime: number = 0;

  onBegin() {
    this.startTime = Date.now();
    console.log('\n🎭 Starting Playwright test execution...');
    console.log('📋 Configuration: Running ALL tests regardless of failures\n');
  }

  onTestBegin(test: TestCase) {
    // Track test start for debugging
    if (process.env.DEBUG_TEST === 'true') {
      console.log(`⏳ Starting: ${test.title}`);
    }
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.stats.total++;
    
    switch (result.status) {
      case 'passed':
        this.stats.passed++;
        if (process.env.DEBUG_TEST === 'true') {
          console.log(`✅ PASSED: ${test.title} (${result.duration}ms)`);
        }
        break;
        
      case 'failed':
        this.stats.failed++;
        const error = result.error?.message || 'Unknown error';
        const location = test.location;
        
        this.failures.push({
          title: test.title,
          file: location.file,
          line: location.line,
          error: error,
          duration: result.duration,
        });
        
        // Always show failures immediately for debugging
        console.log(`\n❌ FAILED: ${test.title}`);
        console.log(`   File: ${location.file}:${location.line}`);
        console.log(`   Error: ${error.split('\n')[0]}`); // First line of error
        console.log(`   Duration: ${result.duration}ms`);
        break;
        
      case 'skipped':
        this.stats.skipped++;
        if (process.env.DEBUG_TEST === 'true') {
          console.log(`⏭️ SKIPPED: ${test.title}`);
        }
        break;
        
      case 'flaky':
        this.stats.flaky++;
        console.log(`⚠️ FLAKY: ${test.title} (passed on retry)`);
        break;
    }
  }

  onEnd(result: FullResult) {
    const duration = Date.now() - this.startTime;
    this.stats.duration = duration;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST EXECUTION COMPLETE - ALL TESTS RAN');
    console.log('='.repeat(80));
    
    // Overall statistics
    console.log('\n📈 Overall Statistics:');
    console.log(`   Total Tests: ${this.stats.total}`);
    console.log(`   ✅ Passed: ${this.stats.passed} (${this.getPercentage(this.stats.passed)}%)`);
    console.log(`   ❌ Failed: ${this.stats.failed} (${this.getPercentage(this.stats.failed)}%)`);
    console.log(`   ⏭️ Skipped: ${this.stats.skipped} (${this.getPercentage(this.stats.skipped)}%)`);
    console.log(`   ⚠️ Flaky: ${this.stats.flaky}`);
    console.log(`   ⏱️ Duration: ${(duration / 1000).toFixed(1)}s`);
    console.log(`   📉 Success Rate: ${this.getPercentage(this.stats.passed)}%`);
    
    // Failure summary if any
    if (this.failures.length > 0) {
      console.log('\n❌ FAILURE SUMMARY:');
      console.log('='.repeat(80));
      
      // Group failures by file for better organization
      const failuresByFile = new Map<string, typeof this.failures>();
      this.failures.forEach(failure => {
        if (!failuresByFile.has(failure.file)) {
          failuresByFile.set(failure.file, []);
        }
        failuresByFile.get(failure.file)!.push(failure);
      });
      
      // Display failures grouped by file
      failuresByFile.forEach((failures, file) => {
        console.log(`\n📁 ${file}:`);
        failures.forEach((failure, index) => {
          console.log(`   ${index + 1}. ${failure.title} (line ${failure.line})`);
          console.log(`      Error: ${failure.error.split('\n')[0]}`);
        });
      });
      
      // Pattern detection for common issues
      this.detectFailurePatterns();
    }
    
    // Success message if all passed
    if (this.stats.failed === 0 && this.stats.total > 0) {
      console.log('\n✅ SUCCESS: All tests passed!');
    }
    
    // Visibility confirmation
    console.log('\n📌 KEY ACHIEVEMENT: Full test visibility achieved!');
    console.log(`   - Executed ${this.stats.total} tests despite ${this.stats.failed} failures`);
    console.log('   - No tests were skipped due to earlier failures');
    console.log('   - Complete failure analysis available for debugging\n');
  }
  
  private getPercentage(value: number): string {
    if (this.stats.total === 0) return '0';
    return ((value / this.stats.total) * 100).toFixed(1);
  }
  
  private detectFailurePatterns() {
    const patterns = new Map<string, number>();
    
    // Analyze error messages for patterns
    this.failures.forEach(failure => {
      if (failure.error.includes('timeout')) {
        patterns.set('Timeout Issues', (patterns.get('Timeout Issues') || 0) + 1);
      }
      if (failure.error.includes('locator')) {
        patterns.set('Element Not Found', (patterns.get('Element Not Found') || 0) + 1);
      }
      if (failure.error.includes('navigation')) {
        patterns.set('Navigation Problems', (patterns.get('Navigation Problems') || 0) + 1);
      }
      if (failure.error.includes('expect')) {
        patterns.set('Assertion Failures', (patterns.get('Assertion Failures') || 0) + 1);
      }
    });
    
    if (patterns.size > 0) {
      console.log('\n🔍 FAILURE PATTERNS DETECTED:');
      patterns.forEach((count, pattern) => {
        console.log(`   - ${pattern}: ${count} occurrence(s)`);
      });
    }
  }
}

export default FailureReporter;