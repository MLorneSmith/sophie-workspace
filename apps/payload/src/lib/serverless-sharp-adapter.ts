import sharp from 'sharp';
import type { Sharp } from 'sharp';
import { createOptimizedSharpInstance, getWebOptimizedFormatOptions, getServerlessResizeOptions, type ImageSizeConfig } from './sharp-config';
import { validateImageForProcessing, type FileInput, type ImageValidationResult } from './image-validators';

/**
 * Memory usage tracking interface
 */
export interface MemoryUsage {
  used: number;
  total: number;
  free: number;
  percentage: number;
}

/**
 * Processing result interface
 */
export interface ProcessingResult {
  success: boolean;
  buffer?: Buffer;
  metadata?: sharp.Metadata;
  error?: string;
  memoryUsed?: number;
  processingTime?: number;
}

/**
 * Processing options interface
 */
export interface ProcessingOptions {
  resize?: ImageSizeConfig;
  format?: 'webp' | 'jpeg' | 'png';
  quality?: number;
  progressive?: boolean;
  stripMetadata?: boolean;
  background?: string;
  timeout?: number;
}

/**
 * Serverless Sharp Adapter for memory-conscious image processing
 */
export class ServerlessSharpAdapter {
  private static instance: ServerlessSharpAdapter;
  private readonly memoryLimitMB: number;
  private readonly timeoutMs: number;
  private processingCount: number = 0;
  private totalMemoryUsed: number = 0;

  private constructor(memoryLimitMB: number = 128, timeoutMs: number = 25000) {
    this.memoryLimitMB = memoryLimitMB;
    this.timeoutMs = timeoutMs;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[SERVERLESS-SHARP] Adapter initialized:', {
        memoryLimitMB: this.memoryLimitMB,
        timeoutMs: this.timeoutMs,
      });
    }
  }

  /**
   * Get singleton instance of the adapter
   */
  static getInstance(memoryLimitMB?: number, timeoutMs?: number): ServerlessSharpAdapter {
    if (!ServerlessSharpAdapter.instance) {
      ServerlessSharpAdapter.instance = new ServerlessSharpAdapter(memoryLimitMB, timeoutMs);
    }
    return ServerlessSharpAdapter.instance;
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): MemoryUsage {
    const memUsage = process.memoryUsage();
    const totalMB = memUsage.heapTotal / (1024 * 1024);
    const usedMB = memUsage.heapUsed / (1024 * 1024);
    const freeMB = totalMB - usedMB;
    
    return {
      used: usedMB,
      total: totalMB,
      free: freeMB,
      percentage: (usedMB / totalMB) * 100,
    };
  }

  /**
   * Check if memory usage is within limits
   */
  private isMemoryWithinLimits(): boolean {
    const usage = this.getMemoryUsage();
    return usage.used < this.memoryLimitMB;
  }

  /**
   * Force garbage collection if available
   */
  private forceGarbageCollection(): void {
    if (global.gc) {
      global.gc();
      if (process.env.NODE_ENV === 'development') {
        console.log('[SERVERLESS-SHARP] Forced garbage collection');
      }
    }
  }

  /**
   * Clean up Sharp resources and trigger GC
   */
  private cleanup(): void {
    // Clear Sharp cache
    sharp.cache(false);
    
    // Force garbage collection
    this.forceGarbageCollection();
    
    // Small delay to allow cleanup
    return new Promise(resolve => setTimeout(resolve, 10)) as any;
  }

  /**
   * Process image with memory and timeout limits
   */
  async processWithMemoryLimit(
    input: FileInput | Buffer,
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    const operationId = `op_${this.processingCount++}`;
    
    try {
      // Pre-flight memory check
      if (!this.isMemoryWithinLimits()) {
        this.cleanup();
        
        // Check again after cleanup
        if (!this.isMemoryWithinLimits()) {
          return {
            success: false,
            error: 'Memory limit exceeded before processing',
          };
        }
      }

      // Validate input first
      let validationResult: ImageValidationResult;
      try {
        validationResult = await validateImageForProcessing(input);
        if (!validationResult.isValid) {
          return {
            success: false,
            error: `Validation failed: ${validationResult.errors.join(', ')}`,
          };
        }
      } catch (validationError: any) {
        return {
          success: false,
          error: `Input validation error: ${validationError.message}`,
        };
      }

      // Convert input to buffer
      let buffer: Buffer;
      if (Buffer.isBuffer(input)) {
        buffer = input;
      } else if (input.buffer) {
        buffer = input.buffer;
      } else if (input.data) {
        if (Buffer.isBuffer(input.data)) {
          buffer = input.data;
        } else {
          buffer = Buffer.from(input.data as any);
        }
      } else {
        return {
          success: false,
          error: 'No valid buffer found in input',
        };
      }

      // Create Sharp instance with serverless optimizations
      let sharpInstance: Sharp;
      try {
        sharpInstance = createOptimizedSharpInstance(buffer);
      } catch (sharpError: any) {
        return {
          success: false,
          error: `Failed to create Sharp instance: ${sharpError.message}`,
        };
      }

      // Get metadata for processing decisions
      const metadata = await sharpInstance.metadata();
      
      // Check memory requirements based on image size
      const estimatedMemoryMB = this.estimateProcessingMemory(metadata);
      if (estimatedMemoryMB > this.memoryLimitMB * 0.8) {
        return {
          success: false,
          error: `Image too large for serverless processing (estimated ${estimatedMemoryMB.toFixed(1)}MB)`,
        };
      }

      // Apply transformations with timeout
      const processedBuffer = await Promise.race([
        this.applyTransformations(sharpInstance, options),
        this.createTimeoutPromise(options.timeout || this.timeoutMs),
      ]);

      if (!processedBuffer) {
        return {
          success: false,
          error: 'Processing timed out',
        };
      }

      // Check memory usage after processing
      const memoryUsage = this.getMemoryUsage();
      this.totalMemoryUsed += memoryUsage.used;

      // Log processing info in development
      const processingTime = Date.now() - startTime;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[SERVERLESS-SHARP] ${operationId} completed:`, {
          processingTime: `${processingTime}ms`,
          memoryUsed: `${memoryUsage.used.toFixed(1)}MB`,
          inputSize: `${buffer.length} bytes`,
          outputSize: `${processedBuffer.length} bytes`,
          compression: `${((1 - processedBuffer.length / buffer.length) * 100).toFixed(1)}%`,
        });
      }

      // Cleanup and return success
      await this.cleanup();

      return {
        success: true,
        buffer: processedBuffer,
        metadata,
        memoryUsed: memoryUsage.used,
        processingTime,
      };

    } catch (error: any) {
      // Ensure cleanup even on error
      await this.cleanup();
      
      console.error(`[SERVERLESS-SHARP] ${operationId} failed:`, error);
      return {
        success: false,
        error: error.message,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Apply transformations to Sharp instance
   */
  private async applyTransformations(
    sharpInstance: Sharp,
    options: ProcessingOptions
  ): Promise<Buffer> {
    // Apply resize if specified
    if (options.resize) {
      const resizeOptions = getServerlessResizeOptions(options.resize);
      sharpInstance = sharpInstance.resize(resizeOptions);
    }

    // Apply format conversion
    const format = options.format || 'webp';
    const quality = options.quality || 80;
    const formatOptions = getWebOptimizedFormatOptions(format, quality);
    
    sharpInstance = sharpInstance.toFormat(format as any, formatOptions[format]);

    // Strip metadata for smaller file size (unless disabled)
    if (options.stripMetadata !== false) {
      sharpInstance = sharpInstance.withMetadata({
        density: 72,
        orientation: undefined, // Remove EXIF orientation
      });
    }

    // Set background color for transparency handling
    if (options.background) {
      sharpInstance = sharpInstance.flatten({ background: options.background });
    }

    // Convert to buffer
    return await sharpInstance.toBuffer();
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeoutMs: number): Promise<null> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Processing timeout')), timeoutMs);
    });
  }

  /**
   * Estimate memory requirements for processing
   */
  private estimateProcessingMemory(metadata: sharp.Metadata): number {
    const width = metadata.width || 1000;
    const height = metadata.height || 1000;
    const channels = metadata.channels || 3;
    
    // Estimate memory needed for image processing (input + output + working space)
    const pixelMemory = width * height * channels * 3; // 3x for processing overhead
    return pixelMemory / (1024 * 1024); // Convert to MB
  }

  /**
   * Process multiple sizes of an image
   */
  async processMultipleSizes(
    input: FileInput | Buffer,
    sizes: ImageSizeConfig[],
    options: Omit<ProcessingOptions, 'resize'> = {}
  ): Promise<Map<string, ProcessingResult>> {
    const results = new Map<string, ProcessingResult>();
    
    for (const size of sizes) {
      // Check memory before each operation
      if (!this.isMemoryWithinLimits()) {
        await this.cleanup();
      }
      
      const result = await this.processWithMemoryLimit(input, {
        ...options,
        resize: size,
      });
      
      results.set(size.name, result);
      
      // If any processing fails due to memory, stop
      if (!result.success && result.error?.includes('memory')) {
        console.warn(`[SERVERLESS-SHARP] Stopping batch processing due to memory constraints at size: ${size.name}`);
        break;
      }
    }
    
    return results;
  }

  /**
   * Get adapter statistics
   */
  getStats(): {
    operationsCount: number;
    totalMemoryUsed: number;
    averageMemoryPerOp: number;
    currentMemoryUsage: MemoryUsage;
  } {
    const currentMemory = this.getMemoryUsage();
    return {
      operationsCount: this.processingCount,
      totalMemoryUsed: this.totalMemoryUsed,
      averageMemoryPerOp: this.processingCount > 0 ? this.totalMemoryUsed / this.processingCount : 0,
      currentMemoryUsage: currentMemory,
    };
  }

  /**
   * Reset adapter state (useful for testing)
   */
  reset(): void {
    this.processingCount = 0;
    this.totalMemoryUsed = 0;
    this.cleanup();
  }

  /**
   * Create optimized thumbnails for admin preview
   */
  async createThumbnail(
    input: FileInput | Buffer,
    size: number = 150
  ): Promise<ProcessingResult> {
    const thumbnailConfig: ImageSizeConfig = {
      name: 'thumbnail',
      width: size,
      height: size,
      quality: 60,
      format: 'webp',
      fit: 'cover',
      withoutEnlargement: true,
    };

    return await this.processWithMemoryLimit(input, {
      resize: thumbnailConfig,
      stripMetadata: true,
      background: '#ffffff',
    });
  }

  /**
   * Check if adapter is healthy and ready for processing
   */
  isHealthy(): boolean {
    const memoryUsage = this.getMemoryUsage();
    return (
      memoryUsage.used < this.memoryLimitMB * 0.9 &&
      memoryUsage.percentage < 90
    );
  }
}

/**
 * Convenience function to get adapter instance
 */
export const getSharpAdapter = (): ServerlessSharpAdapter => {
  return ServerlessSharpAdapter.getInstance();
};

/**
 * Process image with default adapter settings
 */
export const processImage = async (
  input: FileInput | Buffer,
  options: ProcessingOptions = {}
): Promise<ProcessingResult> => {
  const adapter = getSharpAdapter();
  return await adapter.processWithMemoryLimit(input, options);
};

/**
 * Create thumbnail with default adapter settings
 */
export const createImageThumbnail = async (
  input: FileInput | Buffer,
  size: number = 150
): Promise<ProcessingResult> => {
  const adapter = getSharpAdapter();
  return await adapter.createThumbnail(input, size);
};