/**
 * Agent Logger - Comprehensive logging system for Claude Code subagents
 * Provides structured logging, execution tracking, and debugging capabilities
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Database } from 'sqlite3';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';

// Re-export base logger types
export type { LogLevel, LogContext } from '@kit/shared/logger';

// Agent-specific log event types
export type AgentEventType = 
  | 'start' 
  | 'tool_call' 
  | 'decision' 
  | 'complete' 
  | 'error'
  | 'parent_handoff'
  | 'child_spawn'
  | 'context_update'
  | 'checkpoint';

// Agent log entry structure
export interface AgentLogEntry {
  id?: number;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  agent_id: string;
  parent_id?: string;
  session_id: string;
  event_type: AgentEventType;
  message: string;
  data?: {
    tool?: string;
    parameters?: Record<string, any>;
    result?: any;
    duration_ms?: number;
    error?: {
      message: string;
      stack?: string;
      code?: string;
    };
    tokens?: {
      input?: number;
      output?: number;
      total?: number;
    };
    memory?: {
      used: number;
      total: number;
    };
    context?: Record<string, any>;
  };
}

// Agent execution context
export interface AgentContext {
  agentId: string;
  parentId?: string;
  sessionId: string;
  agentType: string;
  startTime: number;
  metadata?: Record<string, any>;
}

// Configuration for agent logger
export interface AgentLoggerConfig {
  enableDebug: boolean;
  enableFileLogging: boolean;
  enableDatabaseLogging: boolean;
  logDir: string;
  dbPath: string;
  maxLogSizeMB: number;
  retentionDays: number;
  redactSensitive: boolean;
  sensitivePatterns?: RegExp[];
}

// Default configuration
const DEFAULT_CONFIG: AgentLoggerConfig = {
  enableDebug: process.env.AGENT_DEBUG === 'true',
  enableFileLogging: true,
  enableDatabaseLogging: true,
  logDir: '.claude/logs/agents',
  dbPath: '.claude/logs/agents/agent-logs.db',
  maxLogSizeMB: 100,
  retentionDays: 30,
  redactSensitive: true,
  sensitivePatterns: [
    /api[_-]?key/i,
    /token/i,
    /password/i,
    /secret/i,
    /bearer\s+[\w-]+/i
  ]
};

/**
 * Agent Logger - Main logging class for subagent tracking
 */
export class AgentLogger {
  private config: AgentLoggerConfig;
  private db?: Database;
  private currentContext?: AgentContext;
  private logBuffer: AgentLogEntry[] = [];
  private flushInterval?: NodeJS.Timeout;
  
  constructor(config: Partial<AgentLoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeStorage();
  }

  /**
   * Initialize storage backends
   */
  private async initializeStorage() {
    // Ensure log directory exists
    if (this.config.enableFileLogging) {
      await fs.mkdir(this.config.logDir, { recursive: true });
    }

    // Initialize SQLite database
    if (this.config.enableDatabaseLogging) {
      await this.initializeDatabase();
    }

    // Set up periodic flush
    this.flushInterval = setInterval(() => {
      this.flushLogs().catch(console.error);
    }, 5000);
  }

  /**
   * Initialize SQLite database
   */
  private async initializeDatabase() {
    const sqlite3 = require('sqlite3').verbose();
    const dbDir = path.dirname(this.config.dbPath);
    await fs.mkdir(dbDir, { recursive: true });
    
    this.db = new sqlite3.Database(this.config.dbPath);
    
    const run = promisify(this.db.run.bind(this.db));
    
    // Create table if not exists
    await run(`
      CREATE TABLE IF NOT EXISTS agent_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME NOT NULL,
        level TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        parent_id TEXT,
        session_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await run('CREATE INDEX IF NOT EXISTS idx_agent_id ON agent_logs(agent_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_session_id ON agent_logs(session_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_timestamp ON agent_logs(timestamp)');
    await run('CREATE INDEX IF NOT EXISTS idx_event_type ON agent_logs(event_type)');
  }

  /**
   * Start a new agent execution context
   */
  startAgent(agentType: string, parentId?: string, metadata?: Record<string, any>): string {
    const agentId = this.generateAgentId(agentType);
    const sessionId = this.generateSessionId();
    
    this.currentContext = {
      agentId,
      parentId,
      sessionId,
      agentType,
      startTime: Date.now(),
      metadata
    };

    this.log('INFO', 'start', `Agent ${agentType} started`, {
      context: metadata
    });

    return agentId;
  }

  /**
   * Log a tool call
   */
  logToolCall(
    tool: string, 
    parameters: Record<string, any>, 
    result?: any,
    duration?: number
  ) {
    const sanitizedParams = this.sanitizeData(parameters);
    const sanitizedResult = result ? this.sanitizeData(result) : undefined;

    this.log('INFO', 'tool_call', `Tool ${tool} called`, {
      tool,
      parameters: sanitizedParams,
      result: sanitizedResult,
      duration_ms: duration
    });
  }

  /**
   * Log a decision point
   */
  logDecision(decision: string, context?: Record<string, any>) {
    this.log('INFO', 'decision', decision, {
      context: context ? this.sanitizeData(context) : undefined
    });
  }

  /**
   * Log an error
   */
  logError(error: Error | string, context?: Record<string, any>) {
    const errorData = typeof error === 'string' 
      ? { message: error }
      : { 
          message: error.message,
          stack: error.stack,
          code: (error as any).code
        };

    this.log('ERROR', 'error', errorData.message, {
      error: errorData,
      context: context ? this.sanitizeData(context) : undefined
    });
  }

  /**
   * Complete agent execution
   */
  completeAgent(result?: any, metadata?: Record<string, any>) {
    if (!this.currentContext) return;

    const duration = Date.now() - this.currentContext.startTime;
    
    this.log('INFO', 'complete', `Agent ${this.currentContext.agentType} completed`, {
      duration_ms: duration,
      result: result ? this.sanitizeData(result) : undefined,
      context: metadata
    });

    // Flush logs immediately on completion
    this.flushLogs().catch(console.error);
    
    this.currentContext = undefined;
  }

  /**
   * Core logging method
   */
  private log(
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',
    eventType: AgentEventType,
    message: string,
    data?: any
  ) {
    if (level === 'DEBUG' && !this.config.enableDebug) return;

    const entry: AgentLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      agent_id: this.currentContext?.agentId || 'unknown',
      parent_id: this.currentContext?.parentId,
      session_id: this.currentContext?.sessionId || 'unknown',
      event_type: eventType,
      message,
      data
    };

    this.logBuffer.push(entry);

    // Console output for immediate feedback
    if (this.config.enableDebug || level === 'ERROR') {
      this.consoleOutput(entry);
    }

    // Flush if buffer is getting large
    if (this.logBuffer.length > 100) {
      this.flushLogs().catch(console.error);
    }
  }

  /**
   * Flush buffered logs to storage
   */
  private async flushLogs() {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    // Write to file
    if (this.config.enableFileLogging) {
      await this.writeToFile(logsToFlush);
    }

    // Write to database
    if (this.config.enableDatabaseLogging && this.db) {
      await this.writeToDatabase(logsToFlush);
    }
  }

  /**
   * Write logs to JSON file
   */
  private async writeToFile(logs: AgentLogEntry[]) {
    const date = new Date().toISOString().split('T')[0];
    const sessionId = this.currentContext?.sessionId || 'unknown';
    const logFile = path.join(
      this.config.logDir,
      date,
      sessionId,
      `${this.currentContext?.agentId || 'unknown'}.jsonl`
    );

    await fs.mkdir(path.dirname(logFile), { recursive: true });
    
    const lines = logs.map(log => JSON.stringify(log)).join('\n') + '\n';
    await fs.appendFile(logFile, lines);

    // Check rotation
    await this.rotateLogsIfNeeded();
  }

  /**
   * Write logs to database
   */
  private async writeToDatabase(logs: AgentLogEntry[]) {
    if (!this.db) return;

    const stmt = this.db.prepare(`
      INSERT INTO agent_logs (timestamp, level, agent_id, parent_id, session_id, event_type, message, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const runStmt = promisify(stmt.run.bind(stmt));

    for (const log of logs) {
      await runStmt(
        log.timestamp,
        log.level,
        log.agent_id,
        log.parent_id || null,
        log.session_id,
        log.event_type,
        log.message,
        log.data ? JSON.stringify(log.data) : null
      );
    }

    stmt.finalize();
  }

  /**
   * Console output for immediate feedback
   */
  private consoleOutput(entry: AgentLogEntry) {
    const prefix = `[AGENT-${entry.level}] ${entry.timestamp}`;
    const agentInfo = `[${entry.agent_id}${entry.parent_id ? ` < ${entry.parent_id}` : ''}]`;
    const output = `${prefix} ${agentInfo} ${entry.message}`;
    
    switch (entry.level) {
      case 'DEBUG':
        console.debug(output);
        break;
      case 'INFO':
        console.info(output);
        break;
      case 'WARN':
        console.warn(output);
        break;
      case 'ERROR':
        console.error(output);
        if (entry.data?.error?.stack) {
          console.error(entry.data.error.stack);
        }
        break;
    }
  }

  /**
   * Sanitize sensitive data
   */
  private sanitizeData(data: any): any {
    if (!this.config.redactSensitive) return data;
    
    const sanitized = JSON.parse(JSON.stringify(data));
    this.sanitizeObject(sanitized);
    return sanitized;
  }

  private sanitizeObject(obj: any) {
    if (!obj || typeof obj !== 'object') return;

    for (const key of Object.keys(obj)) {
      // Check if key matches sensitive patterns
      const isKeySensitive = this.config.sensitivePatterns?.some(
        pattern => pattern.test(key)
      );

      if (isKeySensitive) {
        obj[key] = '[REDACTED]';
        continue;
      }

      // Check if value contains sensitive data
      if (typeof obj[key] === 'string') {
        const isSensitive = this.config.sensitivePatterns?.some(
          pattern => pattern.test(obj[key])
        );
        if (isSensitive) {
          obj[key] = '[REDACTED]';
        }
      } else if (typeof obj[key] === 'object') {
        this.sanitizeObject(obj[key]);
      }
    }
  }

  /**
   * Rotate old logs
   */
  private async rotateLogsIfNeeded() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
    
    // Clean up old files
    const dirs = await fs.readdir(this.config.logDir);
    for (const dir of dirs) {
      const dirDate = new Date(dir);
      if (dirDate < cutoffDate) {
        await fs.rm(path.join(this.config.logDir, dir), { recursive: true, force: true });
      }
    }

    // Clean up old database entries
    if (this.db) {
      const run = promisify(this.db.run.bind(this.db));
      await run(
        'DELETE FROM agent_logs WHERE timestamp < ?',
        cutoffDate.toISOString()
      );
    }
  }

  /**
   * Generate unique agent ID
   */
  private generateAgentId(agentType: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${agentType}-${timestamp}-${random}`;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 12);
    const hash = createHash('sha256')
      .update(`${timestamp}-${random}`)
      .digest('hex')
      .substring(0, 16);
    return `session-${hash}`;
  }

  /**
   * Query logs
   */
  async queryLogs(options: {
    agentId?: string;
    sessionId?: string;
    eventType?: AgentEventType;
    level?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  }): Promise<AgentLogEntry[]> {
    if (!this.db) return [];

    let query = 'SELECT * FROM agent_logs WHERE 1=1';
    const params: any[] = [];

    if (options.agentId) {
      query += ' AND agent_id = ?';
      params.push(options.agentId);
    }

    if (options.sessionId) {
      query += ' AND session_id = ?';
      params.push(options.sessionId);
    }

    if (options.eventType) {
      query += ' AND event_type = ?';
      params.push(options.eventType);
    }

    if (options.level) {
      query += ' AND level = ?';
      params.push(options.level);
    }

    if (options.startTime) {
      query += ' AND timestamp >= ?';
      params.push(options.startTime.toISOString());
    }

    if (options.endTime) {
      query += ' AND timestamp <= ?';
      params.push(options.endTime.toISOString());
    }

    query += ' ORDER BY timestamp DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    const all = promisify(this.db.all.bind(this.db));
    const rows = await all(query, params);

    return rows.map((row: any) => ({
      ...row,
      data: row.data ? JSON.parse(row.data) : undefined
    }));
  }

  /**
   * Clean up resources
   */
  async close() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    await this.flushLogs();

    if (this.db) {
      const close = promisify(this.db.close.bind(this.db));
      await close();
    }
  }
}

// Singleton instance for global access
let globalLogger: AgentLogger | null = null;

/**
 * Get the global agent logger instance
 */
export function getAgentLogger(config?: Partial<AgentLoggerConfig>): AgentLogger {
  if (!globalLogger) {
    globalLogger = new AgentLogger(config);
  }
  return globalLogger;
}

/**
 * Create a new agent logger instance
 */
export function createAgentLogger(config?: Partial<AgentLoggerConfig>): AgentLogger {
  return new AgentLogger(config);
}