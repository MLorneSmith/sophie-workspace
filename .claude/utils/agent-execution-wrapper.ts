/**
 * Agent Execution Wrapper
 * Wraps agent execution to provide comprehensive logging and tracking
 */

import { AgentLogger, getAgentLogger, AgentLogEntry, AgentEventType } from './agent-logger';
import { performance } from 'node:perf_hooks';
import * as os from 'node:os';

export interface AgentExecutionConfig {
  agentType: string;
  agentId?: string;
  parentId?: string;
  metadata?: Record<string, any>;
  logger?: AgentLogger;
  captureMemory?: boolean;
  captureTokens?: boolean;
}

export interface ToolCall {
  tool: string;
  parameters: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  result?: any;
  error?: Error;
  duration?: number;
  tokens?: {
    input?: number;
    output?: number;
  };
}

export interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: Error;
  metrics: {
    totalDuration: number;
    toolCallCount: number;
    decisionCount: number;
    errorCount: number;
    memoryUsed?: number;
    totalTokens?: number;
  };
  logs: AgentLogEntry[];
}

/**
 * Agent Execution Wrapper - Provides lifecycle tracking for agents
 */
export class AgentExecutionWrapper {
  private logger: AgentLogger;
  private agentId: string;
  private startTime: number;
  private toolCallCount: number = 0;
  private decisionCount: number = 0;
  private errorCount: number = 0;
  private totalTokens: number = 0;
  private checkpoints: Map<string, any> = new Map();
  private childAgents: Set<string> = new Set();
  
  constructor(private config: AgentExecutionConfig) {
    this.logger = config.logger || getAgentLogger();
    this.startTime = performance.now();
    
    // Start agent logging
    this.agentId = this.logger.startAgent(
      config.agentType,
      config.parentId,
      config.metadata
    );
  }

  /**
   * Get the agent ID
   */
  getAgentId(): string {
    return this.agentId;
  }

  /**
   * Track a tool call with automatic timing
   */
  async trackToolCall<T>(
    toolCall: ToolCall,
    executor: () => Promise<T>
  ): Promise<ToolResult> {
    const startTime = performance.now();
    this.toolCallCount++;
    
    try {
      // Log tool call start
      this.logger.logToolCall(
        toolCall.tool,
        toolCall.parameters,
        undefined,
        undefined
      );

      // Execute the tool
      const result = await executor();
      
      // Calculate duration
      const duration = performance.now() - startTime;
      
      // Log successful completion
      this.logger.logToolCall(
        toolCall.tool,
        toolCall.parameters,
        result,
        duration
      );

      return {
        success: true,
        result,
        duration
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      this.errorCount++;
      
      // Log error
      this.logger.logError(error as Error, {
        tool: toolCall.tool,
        parameters: toolCall.parameters
      });

      return {
        success: false,
        error: error as Error,
        duration
      };
    }
  }

  /**
   * Track a decision point
   */
  trackDecision(
    decision: string,
    context?: Record<string, any>,
    options?: string[]
  ) {
    this.decisionCount++;
    
    this.logger.logDecision(decision, {
      ...context,
      options,
      decisionNumber: this.decisionCount
    });
  }

  /**
   * Track child agent spawn
   */
  trackChildAgent(childAgentId: string, childAgentType: string) {
    this.childAgents.add(childAgentId);
    
    this.logger.log('INFO', 'child_spawn', `Spawned child agent ${childAgentType}`, {
      context: {
        childAgentId,
        childAgentType,
        totalChildren: this.childAgents.size
      }
    });
  }

  /**
   * Create checkpoint for later analysis
   */
  createCheckpoint(name: string, data?: any) {
    this.checkpoints.set(name, {
      timestamp: Date.now(),
      data,
      memoryUsage: this.config.captureMemory ? this.getMemoryUsage() : undefined
    });

    this.logger.log('DEBUG', 'checkpoint', `Checkpoint: ${name}`, {
      context: data
    });
  }

  /**
   * Track token usage
   */
  trackTokens(tokens: { input?: number; output?: number }) {
    if (!this.config.captureTokens) return;
    
    const total = (tokens.input || 0) + (tokens.output || 0);
    this.totalTokens += total;
    
    this.logger.log('DEBUG', 'context_update', 'Token usage updated', {
      tokens: {
        ...tokens,
        total,
        cumulative: this.totalTokens
      }
    });
  }

  /**
   * Log an error with context
   */
  logError(error: Error | string, context?: Record<string, any>) {
    this.errorCount++;
    this.logger.logError(error, context);
  }

  /**
   * Log informational message
   */
  logInfo(message: string, context?: Record<string, any>) {
    this.logger.log('INFO', 'context_update', message, { context });
  }

  /**
   * Log debug message
   */
  logDebug(message: string, context?: Record<string, any>) {
    this.logger.log('DEBUG', 'context_update', message, { context });
  }

  /**
   * Complete agent execution
   */
  async complete(result?: any): Promise<ExecutionResult> {
    const totalDuration = performance.now() - this.startTime;
    
    const metrics = {
      totalDuration,
      toolCallCount: this.toolCallCount,
      decisionCount: this.decisionCount,
      errorCount: this.errorCount,
      memoryUsed: this.config.captureMemory ? this.getMemoryUsage().used : undefined,
      totalTokens: this.config.captureTokens ? this.totalTokens : undefined
    };

    // Log completion
    this.logger.completeAgent(result, {
      metrics,
      checkpoints: Array.from(this.checkpoints.keys()),
      childAgents: Array.from(this.childAgents)
    });

    // Query logs for this execution
    const logs = await this.logger.queryLogs({
      agentId: this.agentId
    });

    return {
      success: this.errorCount === 0,
      result,
      metrics,
      logs
    };
  }

  /**
   * Complete with error
   */
  async completeWithError(error: Error): Promise<ExecutionResult> {
    this.logError(error);
    return this.complete();
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      used: Math.round(usage.heapUsed / 1024 / 1024), // MB
      total: Math.round(usage.heapTotal / 1024 / 1024), // MB
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024) // MB
    };
  }

  /**
   * Create wrapper for child agent
   */
  createChildWrapper(childAgentType: string, metadata?: Record<string, any>): AgentExecutionWrapper {
    const childWrapper = new AgentExecutionWrapper({
      agentType: childAgentType,
      parentId: this.agentId,
      metadata,
      logger: this.logger,
      captureMemory: this.config.captureMemory,
      captureTokens: this.config.captureTokens
    });

    this.trackChildAgent(childWrapper.getAgentId(), childAgentType);
    return childWrapper;
  }
}

/**
 * Wrap an async function with agent execution tracking
 */
export async function withAgentTracking<T>(
  config: AgentExecutionConfig,
  executor: (wrapper: AgentExecutionWrapper) => Promise<T>
): Promise<{ result: T; execution: ExecutionResult }> {
  const wrapper = new AgentExecutionWrapper(config);
  
  try {
    const result = await executor(wrapper);
    const execution = await wrapper.complete(result);
    
    return { result, execution };
  } catch (error) {
    const execution = await wrapper.completeWithError(error as Error);
    throw error;
  }
}

/**
 * Create a tracked tool executor
 */
export function createTrackedToolExecutor(wrapper: AgentExecutionWrapper) {
  return async function executeTrackedTool<T>(
    tool: string,
    parameters: Record<string, any>,
    executor: () => Promise<T>
  ): Promise<T> {
    const result = await wrapper.trackToolCall(
      { tool, parameters },
      executor
    );
    
    if (!result.success && result.error) {
      throw result.error;
    }
    
    return result.result as T;
  };
}

/**
 * Performance profiler for agent operations
 */
export class AgentPerformanceProfiler {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number[]> = new Map();
  
  constructor(private wrapper: AgentExecutionWrapper) {}

  /**
   * Start timing an operation
   */
  startOperation(name: string) {
    this.marks.set(name, performance.now());
    this.wrapper.logDebug(`Started operation: ${name}`);
  }

  /**
   * End timing an operation
   */
  endOperation(name: string): number {
    const startTime = this.marks.get(name);
    if (!startTime) {
      throw new Error(`No start mark for operation: ${name}`);
    }
    
    const duration = performance.now() - startTime;
    
    // Store measurement
    if (!this.measures.has(name)) {
      this.measures.set(name, []);
    }
    this.measures.get(name)!.push(duration);
    
    this.wrapper.logDebug(`Completed operation: ${name}`, {
      duration,
      count: this.measures.get(name)!.length
    });
    
    this.marks.delete(name);
    return duration;
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, { count: number; total: number; avg: number; min: number; max: number }> {
    const summary: Record<string, any> = {};
    
    for (const [name, durations] of this.measures) {
      const total = durations.reduce((sum, d) => sum + d, 0);
      summary[name] = {
        count: durations.length,
        total: Math.round(total),
        avg: Math.round(total / durations.length),
        min: Math.round(Math.min(...durations)),
        max: Math.round(Math.max(...durations))
      };
    }
    
    return summary;
  }

  /**
   * Create checkpoint with performance data
   */
  checkpoint(name: string) {
    this.wrapper.createCheckpoint(name, {
      performance: this.getSummary()
    });
  }
}

/**
 * Helper to create agent context metadata
 */
export function createAgentMetadata(options: {
  task?: string;
  description?: string;
  tags?: string[];
  config?: Record<string, any>;
}): Record<string, any> {
  return {
    task: options.task,
    description: options.description,
    tags: options.tags || [],
    config: options.config || {},
    environment: {
      node: process.version,
      platform: os.platform(),
      arch: os.arch(),
      memory: os.totalmem() / 1024 / 1024 / 1024, // GB
      cpus: os.cpus().length
    },
    timestamp: new Date().toISOString()
  };
}