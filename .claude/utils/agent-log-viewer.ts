#!/usr/bin/env node

/**
 * Agent Log Viewer CLI
 * Interactive tool for viewing and analyzing agent execution logs
 */

import { program } from 'commander';
import { AgentLogger, AgentLogEntry, AgentEventType } from './agent-logger';
import chalk from 'chalk';
import { format } from 'date-fns';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createReadStream } from 'node:fs';
import * as readline from 'node:readline';
import Table from 'cli-table3';

// Color coding for log levels
const levelColors = {
  DEBUG: chalk.gray,
  INFO: chalk.blue,
  WARN: chalk.yellow,
  ERROR: chalk.red
};

// Color coding for event types
const eventColors = {
  start: chalk.green,
  tool_call: chalk.cyan,
  decision: chalk.magenta,
  complete: chalk.green,
  error: chalk.red,
  parent_handoff: chalk.yellow,
  child_spawn: chalk.blue,
  context_update: chalk.gray,
  checkpoint: chalk.gray
};

/**
 * Format a log entry for display
 */
function formatLogEntry(entry: AgentLogEntry, options: {
  verbose?: boolean;
  showData?: boolean;
  color?: boolean;
}): string {
  const timestamp = format(new Date(entry.timestamp), 'HH:mm:ss.SSS');
  const level = options.color ? levelColors[entry.level](entry.level) : entry.level;
  const eventType = options.color ? eventColors[entry.event_type](entry.event_type) : entry.event_type;
  const agentId = entry.agent_id.substring(0, 12);
  
  let output = `${timestamp} [${level}] [${eventType}] ${agentId}: ${entry.message}`;
  
  if (options.showData && entry.data) {
    if (options.verbose) {
      output += '\n' + JSON.stringify(entry.data, null, 2);
    } else {
      // Show compact data
      const dataKeys = Object.keys(entry.data);
      if (dataKeys.length > 0) {
        output += ` {${dataKeys.join(', ')}}`;
      }
    }
  }
  
  return output;
}

/**
 * View logs command
 */
async function viewLogs(options: {
  agentId?: string;
  sessionId?: string;
  eventType?: AgentEventType;
  level?: string;
  since?: string;
  until?: string;
  limit?: number;
  follow?: boolean;
  verbose?: boolean;
  showData?: boolean;
  noColor?: boolean;
}) {
  const logger = new AgentLogger({
    enableDatabaseLogging: true,
    dbPath: '.claude/logs/agents/agent-logs.db'
  });

  // Parse time filters
  const startTime = options.since ? new Date(options.since) : undefined;
  const endTime = options.until ? new Date(options.until) : undefined;

  // Query logs
  const logs = await logger.queryLogs({
    agentId: options.agentId,
    sessionId: options.sessionId,
    eventType: options.eventType as AgentEventType,
    level: options.level,
    startTime,
    endTime,
    limit: options.limit || 100
  });

  // Display logs
  for (const log of logs.reverse()) {
    console.log(formatLogEntry(log, {
      verbose: options.verbose,
      showData: options.showData,
      color: !options.noColor
    }));
  }

  // Follow mode (tail -f)
  if (options.follow) {
    console.log(chalk.dim('\n--- Following logs (Ctrl+C to stop) ---\n'));
    
    // Poll for new logs every second
    let lastTimestamp = logs.length > 0 ? logs[0].timestamp : new Date().toISOString();
    
    const interval = setInterval(async () => {
      const newLogs = await logger.queryLogs({
        agentId: options.agentId,
        sessionId: options.sessionId,
        eventType: options.eventType as AgentEventType,
        level: options.level,
        startTime: new Date(lastTimestamp)
      });
      
      for (const log of newLogs) {
        if (log.timestamp > lastTimestamp) {
          console.log(formatLogEntry(log, {
            verbose: options.verbose,
            showData: options.showData,
            color: !options.noColor
          }));
          lastTimestamp = log.timestamp;
        }
      }
    }, 1000);

    // Handle Ctrl+C
    process.on('SIGINT', () => {
      clearInterval(interval);
      process.exit(0);
    });
  }

  await logger.close();
}

/**
 * Analyze performance command
 */
async function analyzePerformance(agentId?: string, sessionId?: string) {
  const logger = new AgentLogger({
    enableDatabaseLogging: true,
    dbPath: '.claude/logs/agents/agent-logs.db'
  });

  const logs = await logger.queryLogs({
    agentId,
    sessionId
  });

  // Group by agent
  const agentMetrics = new Map<string, {
    startTime?: string;
    endTime?: string;
    toolCalls: number;
    decisions: number;
    errors: number;
    duration?: number;
    tools: Map<string, { count: number; totalDuration: number }>;
  }>();

  for (const log of logs) {
    let metrics = agentMetrics.get(log.agent_id);
    if (!metrics) {
      metrics = {
        toolCalls: 0,
        decisions: 0,
        errors: 0,
        tools: new Map()
      };
      agentMetrics.set(log.agent_id, metrics);
    }

    // Track events
    switch (log.event_type) {
      case 'start':
        metrics.startTime = log.timestamp;
        break;
      case 'complete':
        metrics.endTime = log.timestamp;
        if (log.data?.duration_ms) {
          metrics.duration = log.data.duration_ms;
        }
        break;
      case 'tool_call':
        metrics.toolCalls++;
        if (log.data?.tool) {
          const tool = metrics.tools.get(log.data.tool) || { count: 0, totalDuration: 0 };
          tool.count++;
          if (log.data.duration_ms) {
            tool.totalDuration += log.data.duration_ms;
          }
          metrics.tools.set(log.data.tool, tool);
        }
        break;
      case 'decision':
        metrics.decisions++;
        break;
      case 'error':
        metrics.errors++;
        break;
    }
  }

  // Display performance summary
  console.log(chalk.bold('\n📊 Performance Analysis\n'));

  const table = new Table({
    head: ['Agent ID', 'Duration (ms)', 'Tool Calls', 'Decisions', 'Errors'],
    colWidths: [20, 15, 12, 12, 10]
  });

  for (const [agentId, metrics] of agentMetrics) {
    const duration = metrics.duration || 
      (metrics.startTime && metrics.endTime ? 
        new Date(metrics.endTime).getTime() - new Date(metrics.startTime).getTime() : 0);
    
    table.push([
      agentId.substring(0, 18),
      duration ? duration.toFixed(0) : '-',
      metrics.toolCalls.toString(),
      metrics.decisions.toString(),
      metrics.errors.toString()
    ]);
  }

  console.log(table.toString());

  // Tool usage breakdown
  console.log(chalk.bold('\n🔧 Tool Usage\n'));

  const toolTable = new Table({
    head: ['Tool', 'Calls', 'Avg Duration (ms)', 'Total Duration (ms)'],
    colWidths: [30, 10, 20, 20]
  });

  const allTools = new Map<string, { count: number; totalDuration: number }>();
  for (const metrics of agentMetrics.values()) {
    for (const [tool, stats] of metrics.tools) {
      const existing = allTools.get(tool) || { count: 0, totalDuration: 0 };
      existing.count += stats.count;
      existing.totalDuration += stats.totalDuration;
      allTools.set(tool, existing);
    }
  }

  for (const [tool, stats] of allTools) {
    const avgDuration = stats.totalDuration / stats.count;
    toolTable.push([
      tool,
      stats.count.toString(),
      avgDuration.toFixed(0),
      stats.totalDuration.toFixed(0)
    ]);
  }

  console.log(toolTable.toString());

  await logger.close();
}

/**
 * Find errors command
 */
async function findErrors(options: {
  agentId?: string;
  sessionId?: string;
  since?: string;
  pattern?: string;
}) {
  const logger = new AgentLogger({
    enableDatabaseLogging: true,
    dbPath: '.claude/logs/agents/agent-logs.db'
  });

  const startTime = options.since ? new Date(options.since) : undefined;

  const logs = await logger.queryLogs({
    agentId: options.agentId,
    sessionId: options.sessionId,
    level: 'ERROR',
    startTime
  });

  console.log(chalk.bold.red(`\n❌ Found ${logs.length} errors\n`));

  // Group errors by message
  const errorGroups = new Map<string, AgentLogEntry[]>();
  
  for (const log of logs) {
    let message = log.message;
    if (options.pattern) {
      const regex = new RegExp(options.pattern, 'i');
      if (!regex.test(message) && (!log.data?.error?.message || !regex.test(log.data.error.message))) {
        continue;
      }
    }
    
    const existing = errorGroups.get(message) || [];
    existing.push(log);
    errorGroups.set(message, existing);
  }

  // Display error groups
  for (const [message, errors] of errorGroups) {
    console.log(chalk.red(`\n● ${message} (${errors.length} occurrences)`));
    
    for (const error of errors.slice(0, 3)) {
      const timestamp = format(new Date(error.timestamp), 'yyyy-MM-dd HH:mm:ss');
      console.log(chalk.gray(`  ${timestamp} - ${error.agent_id.substring(0, 12)}`));
      
      if (error.data?.error?.stack) {
        const stackLines = error.data.error.stack.split('\n').slice(0, 3);
        stackLines.forEach(line => console.log(chalk.gray(`    ${line}`)));
      }
    }
    
    if (errors.length > 3) {
      console.log(chalk.gray(`  ... and ${errors.length - 3} more`));
    }
  }

  await logger.close();
}

/**
 * Show execution tree command
 */
async function showTree(sessionId: string) {
  const logger = new AgentLogger({
    enableDatabaseLogging: true,
    dbPath: '.claude/logs/agents/agent-logs.db'
  });

  const logs = await logger.queryLogs({ sessionId });

  // Build agent hierarchy
  const agents = new Map<string, {
    id: string;
    type: string;
    parentId?: string;
    startTime?: string;
    endTime?: string;
    children: Set<string>;
  }>();

  for (const log of logs) {
    if (!agents.has(log.agent_id)) {
      agents.set(log.agent_id, {
        id: log.agent_id,
        type: log.agent_id.split('-')[0],
        parentId: log.parent_id,
        children: new Set()
      });
    }
    
    const agent = agents.get(log.agent_id)!;
    
    if (log.event_type === 'start') {
      agent.startTime = log.timestamp;
    } else if (log.event_type === 'complete') {
      agent.endTime = log.timestamp;
    }
    
    // Track parent-child relationships
    if (log.parent_id && agents.has(log.parent_id)) {
      agents.get(log.parent_id)!.children.add(log.agent_id);
    }
  }

  // Find root agents (no parent)
  const roots = Array.from(agents.values()).filter(a => !a.parentId);

  console.log(chalk.bold(`\n🌳 Agent Execution Tree for Session ${sessionId}\n`));

  // Recursive tree display
  function displayAgent(agent: any, indent: string = '') {
    const duration = agent.startTime && agent.endTime ?
      new Date(agent.endTime).getTime() - new Date(agent.startTime).getTime() : 0;
    
    const status = agent.endTime ? chalk.green('✓') : chalk.yellow('⏳');
    const info = `${status} ${agent.type} (${agent.id.substring(0, 8)}) ${duration ? `[${duration}ms]` : ''}`;
    
    console.log(indent + info);
    
    for (const childId of agent.children) {
      const child = agents.get(childId);
      if (child) {
        displayAgent(child, indent + '  ├─ ');
      }
    }
  }

  for (const root of roots) {
    displayAgent(root);
  }

  await logger.close();
}

/**
 * Export logs command
 */
async function exportLogs(format: 'json' | 'csv', outputFile: string, options: {
  agentId?: string;
  sessionId?: string;
  since?: string;
}) {
  const logger = new AgentLogger({
    enableDatabaseLogging: true,
    dbPath: '.claude/logs/agents/agent-logs.db'
  });

  const startTime = options.since ? new Date(options.since) : undefined;

  const logs = await logger.queryLogs({
    agentId: options.agentId,
    sessionId: options.sessionId,
    startTime
  });

  if (format === 'json') {
    await fs.writeFile(outputFile, JSON.stringify(logs, null, 2));
  } else if (format === 'csv') {
    const csv = [
      'timestamp,level,agent_id,parent_id,session_id,event_type,message',
      ...logs.map(log => 
        `"${log.timestamp}","${log.level}","${log.agent_id}","${log.parent_id || ''}","${log.session_id}","${log.event_type}","${log.message.replace(/"/g, '""')}"`
      )
    ].join('\n');
    
    await fs.writeFile(outputFile, csv);
  }

  console.log(chalk.green(`✅ Exported ${logs.length} logs to ${outputFile}`));

  await logger.close();
}

// CLI setup
program
  .name('agent-log-viewer')
  .description('Claude Code Agent Log Viewer - Analyze and debug agent executions')
  .version('1.0.0');

// View logs command
program
  .command('view')
  .description('View agent logs with filtering')
  .option('-a, --agent-id <id>', 'Filter by agent ID')
  .option('-s, --session-id <id>', 'Filter by session ID')
  .option('-e, --event-type <type>', 'Filter by event type')
  .option('-l, --level <level>', 'Filter by log level (DEBUG, INFO, WARN, ERROR)')
  .option('--since <date>', 'Show logs since date (ISO format or relative like "1h")')
  .option('--until <date>', 'Show logs until date')
  .option('-n, --limit <count>', 'Limit number of logs', '100')
  .option('-f, --follow', 'Follow logs in real-time')
  .option('-v, --verbose', 'Show detailed log data')
  .option('-d, --show-data', 'Show log data fields')
  .option('--no-color', 'Disable colored output')
  .action(viewLogs);

// Analyze performance command
program
  .command('analyze [agentId]')
  .description('Analyze agent performance metrics')
  .option('-s, --session-id <id>', 'Analyze specific session')
  .action(analyzePerformance);

// Find errors command
program
  .command('errors')
  .description('Find and analyze errors')
  .option('-a, --agent-id <id>', 'Filter by agent ID')
  .option('-s, --session-id <id>', 'Filter by session ID')
  .option('--since <date>', 'Show errors since date')
  .option('-p, --pattern <regex>', 'Filter errors by pattern')
  .action(findErrors);

// Show execution tree
program
  .command('tree <sessionId>')
  .description('Show agent execution hierarchy tree')
  .action(showTree);

// Export logs command
program
  .command('export <format> <outputFile>')
  .description('Export logs to file (json or csv)')
  .option('-a, --agent-id <id>', 'Filter by agent ID')
  .option('-s, --session-id <id>', 'Filter by session ID')
  .option('--since <date>', 'Export logs since date')
  .action(exportLogs);

// Parse arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}