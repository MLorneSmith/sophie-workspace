#!/usr/bin/env node

/**
 * Deterministic Test Controller
 * Orchestrates test execution without LLM involvement
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Configuration
const CONFIG = {
  statusFile: `/tmp/.claude_test_status_${process.cwd().replace(/\//g, '_')}`,
  resultFile: `/tmp/.claude_test_results.json`,
  unitTimeout: 5 * 60 * 1000, // 5 minutes
  e2eTimeout: 15 * 60 * 1000, // 15 minutes
  shardTimeout: 10 * 60 * 1000, // 10 minutes per shard
  ports: {
    supabase: 55321,
    web: 3000,
    payload: 3020
  }
};

// Test status tracking
class TestStatus {
  constructor() {
    this.reset();
  }

  reset() {
    this.status = {
      phase: 'initializing',
      status: 'running',
      startTime: new Date().toISOString(),
      unit: { total: 0, passed: 0, failed: 0, skipped: 0 },
      e2e: { 
        total: 0, 
        passed: 0, 
        failed: 0, 
        skipped: 0,
        shards: {}
      },
      infrastructure: {
        supabase: 'unknown',
        ports: 'unknown',
        environment: 'unknown'
      },
      errors: []
    };
  }

  async save() {
    await fs.writeFile(CONFIG.resultFile, JSON.stringify(this.status, null, 2));
  }

  async updateStatusLine(status, passed = 0, failed = 0, total = 0) {
    const timestamp = Math.floor(Date.now() / 1000);
    const line = `${status}|${timestamp}|${passed}|${failed}|${total}`;
    await fs.writeFile(CONFIG.statusFile, line);
  }
}

// Infrastructure checker
class InfrastructureChecker {
  async checkAll() {
    console.log('🔍 Running infrastructure checks...');
    const results = {
      supabase: await this.checkSupabase(),
      ports: await this.checkPorts(),
      environment: await this.checkEnvironment()
    };
    
    return results;
  }

  async checkSupabase() {
    try {
      // Check if Supabase is running
      const { stdout } = await execAsync('cd apps/e2e && npx supabase status 2>&1');
      if (stdout.includes('RUNNING') || stdout.includes('Started')) {
        console.log('✅ Supabase E2E is running');
        return 'running';
      }
      
      console.log('⚠️ Supabase E2E not running, attempting to start...');
      await execAsync('cd apps/e2e && npx supabase start', { timeout: 120000 });
      console.log('✅ Supabase E2E started successfully');
      return 'started';
    } catch (error) {
      console.error('❌ Supabase check failed:', error.message);
      return 'failed';
    }
  }

  async checkPorts() {
    try {
      // Kill processes on test ports
      console.log('🔧 Cleaning up test ports...');
      const killCommands = [
        'pkill -f "playwright" || true',
        'pkill -f "vitest" || true', 
        'pkill -f "next-server" || true',
        `lsof -ti:3000-3020 | xargs kill -9 2>/dev/null || true`
      ];
      
      for (const cmd of killCommands) {
        await execAsync(cmd).catch(() => {}); // Ignore errors
      }
      
      // Wait for processes to die
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('✅ Ports cleaned');
      return 'cleaned';
    } catch (error) {
      console.error('⚠️ Port cleanup warning:', error.message);
      return 'partial';
    }
  }

  async checkEnvironment() {
    try {
      const envPath = path.join(process.cwd(), 'apps/web/.env.test');
      await fs.access(envPath);
      console.log('✅ Test environment file exists');
      return 'valid';
    } catch {
      console.log('⚠️ Creating .env.test from example...');
      try {
        const examplePath = path.join(process.cwd(), 'apps/web/.env.example');
        const content = await fs.readFile(examplePath, 'utf8');
        await fs.writeFile(envPath, content);
        console.log('✅ Created .env.test');
        return 'created';
      } catch (error) {
        console.error('❌ Failed to create .env.test:', error.message);
        return 'failed';
      }
    }
  }

  async fixInfrastructure(results) {
    const fixes = [];
    
    if (results.supabase === 'failed') {
      fixes.push({
        issue: 'Supabase not running',
        command: 'cd apps/e2e && npx supabase start',
        severity: 'critical'
      });
    }
    
    if (results.environment === 'failed') {
      fixes.push({
        issue: 'Missing .env.test file',
        command: 'cp apps/web/.env.example apps/web/.env.test',
        severity: 'critical'
      });
    }
    
    return fixes;
  }
}

// Unit test runner
class UnitTestRunner {
  async run(status) {
    console.log('\n📦 Running unit tests...');
    status.status.phase = 'unit_tests';
    await status.save();
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      let output = '';
      
      const proc = spawn('pnpm', ['test:unit'], {
        cwd: process.cwd(),
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true
      });
      
      proc.stdout.on('data', (data) => {
        output += data.toString();
        process.stdout.write(data);
      });
      
      proc.stderr.on('data', (data) => {
        output += data.toString();
        process.stderr.write(data);
      });
      
      // Set timeout
      const timeout = setTimeout(() => {
        console.error('❌ Unit tests timed out');
        proc.kill('SIGKILL');
      }, CONFIG.unitTimeout);
      
      proc.on('close', (code) => {
        clearTimeout(timeout);
        const duration = Math.round((Date.now() - startTime) / 1000);
        
        // Parse test results from output
        const results = this.parseResults(output);
        
        status.status.unit = results;
        status.status.unit.duration = `${duration}s`;
        status.status.unit.exitCode = code;
        
        console.log(`\n📊 Unit tests completed in ${duration}s`);
        console.log(`   Passed: ${results.passed}/${results.total}`);
        if (results.failed > 0) {
          console.log(`   Failed: ${results.failed}`);
        }
        
        resolve({
          success: code === 0,
          ...results,
          duration,
          output
        });
      });
    });
  }

  parseResults(output) {
    const results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    };
    
    // Parse Vitest output patterns
    const patterns = [
      /(\d+) passed/gi,
      /(\d+) failed/gi,
      /(\d+) skipped/gi,
      /Test Files:\s+(\d+) passed/gi,
      /Tests:\s+(\d+) passed/gi
    ];
    
    // Extract passed count
    const passedMatch = output.match(/(\d+) passed/gi);
    if (passedMatch) {
      const numbers = passedMatch.map(m => parseInt(m.match(/\d+/)[0]));
      results.passed = Math.max(...numbers);
    }
    
    // Extract failed count
    const failedMatch = output.match(/(\d+) failed/gi);
    if (failedMatch) {
      const numbers = failedMatch.map(m => parseInt(m.match(/\d+/)[0]));
      results.failed = Math.max(...numbers);
    }
    
    // Extract skipped count
    const skippedMatch = output.match(/(\d+) skipped/gi);
    if (skippedMatch) {
      const numbers = skippedMatch.map(m => parseInt(m.match(/\d+/)[0]));
      results.skipped = Math.max(...numbers);
    }
    
    results.total = results.passed + results.failed + results.skipped;
    
    // Fallback: if no tests found, check for error patterns
    if (results.total === 0) {
      if (output.includes('PASS') || output.includes('✓')) {
        results.passed = 1;
        results.total = 1;
      } else if (output.includes('FAIL') || output.includes('✗')) {
        results.failed = 1;
        results.total = 1;
      }
    }
    
    return results;
  }
}

// E2E test runner
class E2ETestRunner {
  constructor() {
    this.shards = [
      { id: 1, name: 'Accessibility Large', tests: 13 },
      { id: 2, name: 'Authentication', tests: 10 },
      { id: 3, name: 'Admin', tests: 9 },
      { id: 4, name: 'Smoke', tests: 9 },
      { id: 5, name: 'Accessibility Simple', tests: 6 },
      { id: 6, name: 'Team Accounts', tests: 6 },
      { id: 7, name: 'Account + Invitations', tests: 8 },
      { id: 8, name: 'Quick Tests', tests: 3 },
      { id: 9, name: 'Billing', tests: 2 }
    ];
  }

  async run(status) {
    console.log('\n🌐 Running E2E tests (9 parallel shards)...');
    status.status.phase = 'e2e_tests';
    await status.save();
    
    const startTime = Date.now();
    const shardPromises = this.shards.map(shard => this.runShard(shard, status));
    
    // Wait for all shards to complete
    const shardResults = await Promise.allSettled(shardPromises);
    
    // Aggregate results
    const results = this.aggregateResults(shardResults, status);
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    status.status.e2e = { ...status.status.e2e, ...results, duration: `${duration}s` };
    
    console.log(`\n📊 E2E tests completed in ${duration}s`);
    console.log(`   Passed: ${results.passed}/${results.total}`);
    if (results.failed > 0) {
      console.log(`   Failed: ${results.failed}`);
    }
    
    return {
      success: results.failed === 0,
      ...results,
      duration
    };
  }

  async runShard(shard, status) {
    return new Promise((resolve) => {
      console.log(`  🚀 Starting shard ${shard.id}: ${shard.name}`);
      const startTime = Date.now();
      let output = '';
      
      const proc = spawn('pnpm', ['--filter', 'web-e2e', `test:shard${shard.id}`], {
        cwd: process.cwd(),
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true
      });
      
      proc.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      proc.stderr.on('data', (data) => {
        output += data.toString();
      });
      
      // Set timeout
      const timeout = setTimeout(() => {
        console.error(`  ❌ Shard ${shard.id} timed out`);
        proc.kill('SIGKILL');
      }, CONFIG.shardTimeout);
      
      proc.on('close', (code) => {
        clearTimeout(timeout);
        const duration = Math.round((Date.now() - startTime) / 1000);
        const results = this.parseShardResults(output);
        
        // Update shard status
        status.status.e2e.shards[`shard_${shard.id}`] = {
          name: shard.name,
          ...results,
          duration: `${duration}s`,
          exitCode: code
        };
        
        if (code === 0) {
          console.log(`  ✅ Shard ${shard.id} completed: ${results.passed}/${results.total} passed (${duration}s)`);
        } else {
          console.log(`  ❌ Shard ${shard.id} failed: ${results.failed} failures (${duration}s)`);
        }
        
        resolve({
          shard: shard.id,
          success: code === 0,
          ...results,
          duration,
          output
        });
      });
    });
  }

  parseShardResults(output) {
    const results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0
    };
    
    // Check for Playwright completion patterns first
    // Look for the final summary line: "X passed (Xm Xs)"
    const finalSummaryMatch = output.match(/(\d+)\s+passed\s*\([^)]+\)/);
    if (finalSummaryMatch) {
      results.passed = parseInt(finalSummaryMatch[1]);
      results.total = results.passed;
    }
    
    // Look for failed tests
    const failedSummaryMatch = output.match(/(\d+)\s+failed/);
    if (failedSummaryMatch) {
      results.failed = parseInt(failedSummaryMatch[1]);
      results.total = (results.passed || 0) + results.failed;
    }
    
    // Look for skipped tests
    const skippedSummaryMatch = output.match(/(\d+)\s+skipped/);
    if (skippedSummaryMatch) {
      results.skipped = parseInt(skippedSummaryMatch[1]);
    }
    
    // Also check for "Running X tests" pattern
    const runningMatch = output.match(/Running\s+(\d+)\s+tests/);
    if (runningMatch && results.total === 0) {
      results.total = parseInt(runningMatch[1]);
    }
    
    // Check for infrastructure failures
    if (output.includes('webServer timeout') || output.includes('WebServer was not able to start')) {
      results.infrastructureFailure = true;
      results.failed = results.total || 1;
      results.passed = 0;
    }
    
    // If we found "Running X tests" but no completion, tests might still be running
    if (runningMatch && !finalSummaryMatch && !failedSummaryMatch) {
      results.stillRunning = true;
    }
    
    return results;
  }

  aggregateResults(shardResults, status) {
    const totals = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      infrastructureFailures: 0
    };
    
    for (const result of shardResults) {
      if (result.status === 'fulfilled' && result.value) {
        totals.total += result.value.total || 0;
        totals.passed += result.value.passed || 0;
        totals.failed += result.value.failed || 0;
        totals.skipped += result.value.skipped || 0;
        
        if (result.value.infrastructureFailure) {
          totals.infrastructureFailures++;
        }
      } else if (result.status === 'rejected') {
        // Shard failed to run
        totals.failed++;
        console.error('  ❌ Shard execution error:', result.reason);
      }
    }
    
    return totals;
  }
}

// Main test controller
class TestController {
  constructor() {
    this.status = new TestStatus();
    this.infra = new InfrastructureChecker();
    this.unitRunner = new UnitTestRunner();
    this.e2eRunner = new E2ETestRunner();
  }

  async run(options = {}) {
    console.log('🎯 Starting Deterministic Test Execution');
    console.log('═══════════════════════════════════════\n');
    
    try {
      // Initialize status tracking
      await this.status.updateStatusLine('running', 0, 0, 0);
      
      // Phase 1: Infrastructure checks
      console.log('Phase 1: Infrastructure Validation');
      console.log('───────────────────────────────────');
      const infraResults = await this.infra.checkAll();
      this.status.status.infrastructure = infraResults;
      await this.status.save();
      
      // Check for critical infrastructure failures
      const fixes = await this.infra.fixInfrastructure(infraResults);
      if (fixes.some(f => f.severity === 'critical')) {
        console.error('\n❌ Critical infrastructure issues detected:');
        fixes.forEach(fix => {
          console.error(`   - ${fix.issue}`);
          console.error(`     Fix: ${fix.command}`);
        });
        
        this.status.status.status = 'failed';
        this.status.status.errors = fixes;
        await this.status.save();
        await this.status.updateStatusLine('failed', 0, 1, 1);
        process.exit(1);
      }
      
      // Phase 2: Unit tests
      if (!options.e2eOnly) {
        console.log('\nPhase 2: Unit Tests');
        console.log('───────────────────────');
        const unitResults = await this.unitRunner.run(this.status);
        await this.status.save();
        
        if (!unitResults.success && !options.continueOnFailure) {
          console.error('\n❌ Unit tests failed, stopping execution');
          await this.status.updateStatusLine('failed', unitResults.passed, unitResults.failed, unitResults.total);
          process.exit(1);
        }
      }
      
      // Phase 3: E2E tests
      if (!options.unitOnly) {
        console.log('\nPhase 3: E2E Tests');
        console.log('───────────────────────');
        const e2eResults = await this.e2eRunner.run(this.status);
        await this.status.save();
        
        if (!e2eResults.success) {
          console.error('\n❌ E2E tests failed');
          
          if (e2eResults.infrastructureFailures > 0) {
            console.error('\n⚠️ Infrastructure failures detected during E2E tests:');
            console.error('   - Supabase may have stopped');
            console.error('   - Run: cd apps/e2e && npx supabase start');
          }
        }
      }
      
      // Phase 4: Final report
      await this.generateFinalReport();
      
      // Update status line with final results
      const totalPassed = this.status.status.unit.passed + this.status.status.e2e.passed;
      const totalFailed = this.status.status.unit.failed + this.status.status.e2e.failed;
      const totalTests = this.status.status.unit.total + this.status.status.e2e.total;
      
      const finalStatus = totalFailed === 0 ? 'success' : 'failed';
      await this.status.updateStatusLine(finalStatus, totalPassed, totalFailed, totalTests);
      
      // Exit with appropriate code
      process.exit(totalFailed === 0 ? 0 : 1);
      
    } catch (error) {
      console.error('\n❌ Test execution failed:', error);
      this.status.status.status = 'error';
      this.status.status.errors.push(error.message);
      await this.status.save();
      await this.status.updateStatusLine('failed', 0, 1, 1);
      process.exit(1);
    }
  }

  async generateFinalReport() {
    console.log('\n\n📊 TEST EXECUTION COMPLETE');
    console.log('═══════════════════════════════════════\n');
    
    const unit = this.status.status.unit;
    const e2e = this.status.status.e2e;
    
    // Calculate totals
    const totalTests = unit.total + e2e.total;
    const totalPassed = unit.passed + e2e.passed;
    const totalFailed = unit.failed + e2e.failed;
    const totalSkipped = unit.skipped + e2e.skipped;
    
    // Infrastructure status
    console.log('Infrastructure Status:');
    console.log(`  Supabase: ${this.status.status.infrastructure.supabase}`);
    console.log(`  Ports: ${this.status.status.infrastructure.ports}`);
    console.log(`  Environment: ${this.status.status.infrastructure.environment}`);
    
    // Unit test results
    if (unit.total > 0) {
      console.log('\nUnit Tests:');
      console.log(`  Total: ${unit.total}`);
      console.log(`  ✅ Passed: ${unit.passed}`);
      if (unit.failed > 0) console.log(`  ❌ Failed: ${unit.failed}`);
      if (unit.skipped > 0) console.log(`  ⏭️ Skipped: ${unit.skipped}`);
      if (unit.duration) console.log(`  ⏱️ Duration: ${unit.duration}`);
    }
    
    // E2E test results
    if (e2e.total > 0) {
      console.log('\nE2E Tests:');
      console.log(`  Total: ${e2e.total}`);
      console.log(`  ✅ Passed: ${e2e.passed}`);
      if (e2e.failed > 0) console.log(`  ❌ Failed: ${e2e.failed}`);
      if (e2e.skipped > 0) console.log(`  ⏭️ Skipped: ${e2e.skipped}`);
      if (e2e.duration) console.log(`  ⏱️ Duration: ${e2e.duration}`);
      
      // Shard details
      if (Object.keys(e2e.shards).length > 0) {
        console.log('\n  Shard Results:');
        for (const [key, shard] of Object.entries(e2e.shards)) {
          const status = shard.failed > 0 ? '❌' : '✅';
          console.log(`    ${status} ${shard.name}: ${shard.passed}/${shard.total} (${shard.duration})`);
        }
      }
    }
    
    // Overall summary
    console.log('\n' + '═'.repeat(40));
    console.log('OVERALL SUMMARY:');
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  ✅ Passed: ${totalPassed}`);
    if (totalFailed > 0) console.log(`  ❌ Failed: ${totalFailed}`);
    if (totalSkipped > 0) console.log(`  ⏭️ Skipped: ${totalSkipped}`);
    
    const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
    console.log(`  Success Rate: ${successRate}%`);
    
    // Final status
    console.log('\n' + '═'.repeat(40));
    if (totalFailed === 0) {
      console.log('✅ ALL TESTS PASSED! 🎉');
    } else {
      console.log(`❌ ${totalFailed} TEST${totalFailed > 1 ? 'S' : ''} FAILED`);
      
      // Provide fix suggestions
      if (e2e.infrastructureFailures > 0) {
        console.log('\n💡 Suggested fixes:');
        console.log('   1. Restart Supabase: cd apps/e2e && npx supabase start');
        console.log('   2. Clear ports: pkill -f "playwright|next-server"');
        console.log('   3. Retry tests: node .claude/scripts/test-controller.js');
      }
    }
    
    // Save final status
    this.status.status.status = totalFailed === 0 ? 'success' : 'failed';
    await this.status.save();
    
    console.log('\n📁 Full results saved to:', CONFIG.resultFile);
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    unitOnly: false,
    e2eOnly: false,
    continueOnFailure: false,
    debug: process.env.DEBUG_TEST === 'true'
  };
  
  for (const arg of args) {
    switch (arg) {
      case '--unit':
        options.unitOnly = true;
        break;
      case '--e2e':
        options.e2eOnly = true;
        break;
      case '--continue':
        options.continueOnFailure = true;
        break;
      case '--debug':
        options.debug = true;
        break;
    }
  }
  
  return options;
}

// Main execution
if (require.main === module) {
  const options = parseArgs();
  
  if (options.debug) {
    console.log('🔍 Debug mode enabled');
  }
  
  const controller = new TestController();
  controller.run(options);
}

module.exports = { TestController, TestStatus, InfrastructureChecker };