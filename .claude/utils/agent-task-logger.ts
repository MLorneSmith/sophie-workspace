/**
 * Agent Task Logger Integration
 * Wraps Task tool execution with comprehensive logging
 */

import { AgentExecutionWrapper, createAgentMetadata, withAgentTracking } from './agent-execution-wrapper';
import { getAgentLogger } from './agent-logger';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Enhanced Task tool wrapper with logging
 * This function should be called instead of the raw Task tool
 */
export async function executeTaskWithLogging(params: {
  subagent_type: string;
  description: string;
  prompt: string;
}, originalTaskExecutor: (params: any) => Promise<any>) {
  
  // Create metadata for this task execution
  const metadata = createAgentMetadata({
    task: params.description,
    description: `Executing ${params.subagent_type} agent`,
    tags: ['task-tool', params.subagent_type],
    config: {
      subagent_type: params.subagent_type
    }
  });

  // Execute with tracking
  const { result, execution } = await withAgentTracking(
    {
      agentType: params.subagent_type,
      metadata,
      captureMemory: true,
      captureTokens: false // Task tool doesn't provide token info
    },
    async (wrapper) => {
      // Log the task initiation
      wrapper.logInfo(`Starting ${params.subagent_type} agent`, {
        description: params.description,
        promptLength: params.prompt.length
      });

      // Track this as a tool call
      const taskResult = await wrapper.trackToolCall(
        {
          tool: 'Task',
          parameters: {
            subagent_type: params.subagent_type,
            description: params.description,
            prompt_preview: params.prompt.substring(0, 200) + '...'
          }
        },
        async () => {
          // Execute the actual Task tool
          return await originalTaskExecutor(params);
        }
      );

      if (taskResult.success) {
        wrapper.logInfo(`${params.subagent_type} agent completed successfully`, {
          result: taskResult.result
        });
      } else {
        wrapper.logError(`${params.subagent_type} agent failed`, {
          error: taskResult.error
        });
      }

      return taskResult.result;
    }
  );

  // Log execution summary
  console.log(`
📊 Agent Execution Summary:
  • Agent Type: ${params.subagent_type}
  • Duration: ${(execution.metrics.totalDuration / 1000).toFixed(2)}s
  • Tool Calls: ${execution.metrics.toolCallCount}
  • Errors: ${execution.metrics.errorCount}
  • Success: ${execution.success ? '✅' : '❌'}
  • Log Session: ${execution.logs[0]?.session_id || 'unknown'}
  `);

  return result;
}

/**
 * Initialize agent logging for test command
 * Call this at the start of test execution
 */
export async function initializeTestLogging() {
  const logger = getAgentLogger({
    enableDebug: process.env.DEBUG_TEST === 'true',
    enableFileLogging: true,
    enableDatabaseLogging: true,
    logDir: '.claude/logs/agents',
    dbPath: '.claude/logs/agents/agent-logs.db'
  });

  console.log(`
🔍 Agent Logging Enabled
  • Debug Mode: ${process.env.DEBUG_TEST === 'true' ? 'ON' : 'OFF'}
  • Log Directory: .claude/logs/agents/
  • Database: .claude/logs/agents/agent-logs.db
  • Use 'pnpm --filter @claude/agent-logger log-viewer view' to inspect logs
  `);

  return logger;
}

/**
 * Generate test execution report from logs
 */
export async function generateTestReport(sessionId?: string) {
  const logger = getAgentLogger();
  
  // Query all logs for this session or recent logs
  const logs = await logger.queryLogs({
    sessionId,
    limit: 1000
  });

  // Group by agent type
  const agentGroups = new Map<string, {
    count: number;
    totalDuration: number;
    errors: number;
    toolCalls: number;
  }>();

  for (const log of logs) {
    const agentType = log.agent_id.split('-')[0];
    if (!agentGroups.has(agentType)) {
      agentGroups.set(agentType, {
        count: 0,
        totalDuration: 0,
        errors: 0,
        toolCalls: 0
      });
    }

    const group = agentGroups.get(agentType)!;
    
    switch (log.event_type) {
      case 'start':
        group.count++;
        break;
      case 'complete':
        if (log.data?.duration_ms) {
          group.totalDuration += log.data.duration_ms;
        }
        break;
      case 'error':
        group.errors++;
        break;
      case 'tool_call':
        group.toolCalls++;
        break;
    }
  }

  // Generate report
  const report = {
    sessionId,
    timestamp: new Date().toISOString(),
    totalAgents: Array.from(agentGroups.values()).reduce((sum, g) => sum + g.count, 0),
    totalErrors: Array.from(agentGroups.values()).reduce((sum, g) => sum + g.errors, 0),
    totalToolCalls: Array.from(agentGroups.values()).reduce((sum, g) => sum + g.toolCalls, 0),
    agentBreakdown: Object.fromEntries(agentGroups)
  };

  // Save report
  const reportPath = path.join(
    '.claude/logs/agents/reports',
    `test-report-${new Date().toISOString().split('T')[0]}.json`
  );
  
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  console.log(`
📋 Test Execution Report:
  • Total Agents: ${report.totalAgents}
  • Total Errors: ${report.totalErrors}
  • Total Tool Calls: ${report.totalToolCalls}
  • Report saved to: ${reportPath}
  `);

  return report;
}

/**
 * Monitor agent execution in real-time
 */
export class AgentExecutionMonitor {
  private intervalId?: NodeJS.Timeout;
  
  constructor(private sessionId?: string) {}

  start() {
    console.log('🔴 Starting real-time agent monitoring...\n');
    
    this.intervalId = setInterval(async () => {
      const logger = getAgentLogger();
      const recentLogs = await logger.queryLogs({
        sessionId: this.sessionId,
        startTime: new Date(Date.now() - 5000), // Last 5 seconds
        limit: 10
      });

      for (const log of recentLogs) {
        const timestamp = new Date(log.timestamp).toLocaleTimeString();
        const agentShort = log.agent_id.substring(0, 8);
        
        switch (log.event_type) {
          case 'start':
            console.log(`[${timestamp}] 🚀 Agent started: ${agentShort}`);
            break;
          case 'tool_call':
            if (log.data?.tool) {
              console.log(`[${timestamp}] 🔧 Tool called: ${log.data.tool} by ${agentShort}`);
            }
            break;
          case 'error':
            console.log(`[${timestamp}] ❌ Error in ${agentShort}: ${log.message}`);
            break;
          case 'complete':
            const duration = log.data?.duration_ms 
              ? `(${(log.data.duration_ms / 1000).toFixed(1)}s)` 
              : '';
            console.log(`[${timestamp}] ✅ Agent completed: ${agentShort} ${duration}`);
            break;
        }
      }
    }, 2000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('\n🔵 Stopped agent monitoring');
    }
  }
}

/**
 * Wrap test command execution with logging
 */
export async function wrapTestCommandWithLogging(
  testExecutor: () => Promise<any>
) {
  // Initialize logging
  const logger = await initializeTestLogging();
  
  // Start monitoring if in debug mode
  let monitor: AgentExecutionMonitor | undefined;
  if (process.env.DEBUG_TEST === 'true') {
    monitor = new AgentExecutionMonitor();
    monitor.start();
  }

  try {
    // Execute the test command
    const result = await testExecutor();
    
    // Generate report
    await generateTestReport();
    
    return result;
  } finally {
    // Stop monitoring
    if (monitor) {
      monitor.stop();
    }
    
    // Close logger
    await logger.close();
  }
}