/**
 * Progress reporter for long-running migration tasks
 * Provides real-time updates on current operation and progress
 */
import chalk from 'chalk';
import { EventEmitter } from 'events';
export class ProgressReporter extends EventEmitter {
    constructor(reportingIntervalMs = 5000) {
        super();
        this.reportingIntervalMs = reportingIntervalMs;
        this.steps = new Map();
        this.currentStepId = null;
        this.intervalId = null;
        this.startTime = new Date();
    }
    registerStep(id, name, totalItems) {
        this.steps.set(id, {
            id,
            name,
            totalItems,
            processedItems: 0,
            status: 'pending',
        });
        this.emit('stepRegistered', this.steps.get(id));
    }
    startStep(id) {
        const step = this.steps.get(id);
        if (!step) {
            throw new Error(`Step ${id} not registered`);
        }
        step.status = 'running';
        step.startTime = new Date();
        this.currentStepId = id;
        this.emit('stepStarted', step);
        this.printProgress();
    }
    updateProgress(id, processedItems) {
        const step = this.steps.get(id);
        if (!step) {
            throw new Error(`Step ${id} not registered`);
        }
        step.processedItems = processedItems;
        this.emit('progressUpdated', step);
    }
    completeStep(id) {
        const step = this.steps.get(id);
        if (!step) {
            throw new Error(`Step ${id} not registered`);
        }
        step.status = 'completed';
        step.endTime = new Date();
        if (step.totalItems) {
            step.processedItems = step.totalItems;
        }
        if (this.currentStepId === id) {
            this.currentStepId = null;
        }
        this.emit('stepCompleted', step);
        this.printProgress();
    }
    failStep(id, error) {
        const step = this.steps.get(id);
        if (!step) {
            throw new Error(`Step ${id} not registered`);
        }
        step.status = 'failed';
        step.endTime = new Date();
        step.error = error;
        if (this.currentStepId === id) {
            this.currentStepId = null;
        }
        this.emit('stepFailed', step);
        this.printProgress();
    }
    startReporting() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        this.intervalId = setInterval(() => {
            this.printProgress();
        }, this.reportingIntervalMs);
    }
    stopReporting() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    printProgress() {
        const elapsedSeconds = (new Date().getTime() - this.startTime.getTime()) / 1000;
        console.log(`\n${chalk.blue('--- Migration Progress')} (${elapsedSeconds.toFixed(1)}s elapsed) ${chalk.blue('---')}`);
        let pendingCount = 0;
        let completedCount = 0;
        let failedCount = 0;
        this.steps.forEach((step) => {
            let status;
            let progressInfo = '';
            switch (step.status) {
                case 'pending':
                    status = chalk.gray('⏱️ PENDING');
                    pendingCount++;
                    break;
                case 'running':
                    status = chalk.cyan('🔄 RUNNING');
                    if (step.totalItems && step.processedItems !== undefined) {
                        const percent = Math.round((step.processedItems / step.totalItems) * 100);
                        progressInfo = chalk.white(` (${step.processedItems}/${step.totalItems}, ${percent}%)`);
                    }
                    break;
                case 'completed':
                    status = chalk.green('✅ DONE');
                    if (step.startTime && step.endTime) {
                        const duration = (step.endTime.getTime() - step.startTime.getTime()) / 1000;
                        progressInfo = chalk.gray(` (${duration.toFixed(1)}s)`);
                    }
                    completedCount++;
                    break;
                case 'failed':
                    status = chalk.red('❌ FAILED');
                    failedCount++;
                    progressInfo = step.error
                        ? chalk.red(` (${step.error.message})`)
                        : '';
                    break;
            }
            console.log(`${status}: ${chalk.white(step.name)}${progressInfo}`);
        });
        const totalSteps = this.steps.size;
        const runningCount = totalSteps - pendingCount - completedCount - failedCount;
        console.log(`\n${chalk.white('Summary:')} ${chalk.green(`${completedCount}/${totalSteps} completed`)}, ${chalk.cyan(`${runningCount} running`)}, ${chalk.gray(`${pendingCount} pending`)}, ${chalk.red(`${failedCount} failed`)}`);
        if (completedCount === totalSteps) {
            console.log(chalk.green('✅ All steps completed successfully!'));
        }
        else if (failedCount > 0) {
            console.log(chalk.red('❌ Some steps failed, check logs for details'));
        }
        console.log(chalk.blue('--------------------------------------------\n'));
    }
    getOverallProgress() {
        const totalSteps = this.steps.size;
        let completedSteps = 0;
        let failedSteps = 0;
        this.steps.forEach((step) => {
            if (step.status === 'completed') {
                completedSteps++;
            }
            else if (step.status === 'failed') {
                failedSteps++;
            }
        });
        const elapsedSeconds = (new Date().getTime() - this.startTime.getTime()) / 1000;
        return {
            totalSteps,
            completedSteps,
            failedSteps,
            elapsedSeconds,
        };
    }
}
// Example usage:
/*
const reporter = new ProgressReporter(3000);

// Register steps
reporter.registerStep('setup', 'Setting up database', 1);
reporter.registerStep('posts', 'Migrating blog posts', 10);
reporter.registerStep('private', 'Migrating private posts', 5);
reporter.registerStep('verify', 'Verifying content integrity', 1);

// Start reporting
reporter.startReporting();

// Use it in an async process
async function runMigration() {
  try {
    // Setup phase
    reporter.startStep('setup');
    await someAsyncOperation();
    reporter.completeStep('setup');
    
    // Posts migration
    reporter.startStep('posts');
    for (let i = 0; i < 10; i++) {
      await migratePost(i);
      reporter.updateProgress('posts', i + 1);
    }
    reporter.completeStep('posts');
    
    // Private posts migration
    reporter.startStep('private');
    try {
      for (let i = 0; i < 5; i++) {
        await migratePrivatePost(i);
        reporter.updateProgress('private', i + 1);
      }
      reporter.completeStep('private');
    } catch (error) {
      reporter.failStep('private', error);
    }
    
    // Verification
    reporter.startStep('verify');
    await verifyContent();
    reporter.completeStep('verify');
  } finally {
    reporter.stopReporting();
  }
}
*/
