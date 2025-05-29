import sharp from 'sharp';
import type { Sharp } from 'sharp';

/**
 * Image size configurations for serverless optimization
 */
export interface ImageSizeConfig {
  name: string;
  width: number;
  height?: number;
  quality: number;
  format: 'webp' | 'jpeg' | 'png';
  fit: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  withoutEnlargement: boolean;
}

/**
 * Sharp configuration for serverless environments
 */
export interface ServerlessSharpConfig {
  cache: boolean;
  concurrency: number;
  simd: boolean;
  limitInputPixels: number;
  sequentialRead: boolean;
  density: number;
  pages: number;
  page: number;
  subifd: number;
  level: number;
  pyramid: boolean;
  xres: number;
  yres: number;
  chromaSubsampling: string;
  trellisQuantisation: boolean;
  overshootDeringing: boolean;
  optimiseScans: boolean;
  mozjpeg: boolean;
  quantisationTable: number;
  palette: boolean;
  quality: number;
  lossless: boolean;
  nearLossless: boolean;
  smartSubsample: boolean;
  preset: string;
  effort: number;
  loop: number;
  delay: number[];
  force: boolean;
  compression: string;
  predictor: string;
  tile: boolean;
  tileHeight: number;
  tileWidth: number;
  resolutionUnit: string;
  bitdepth: number;
  progressive: boolean;
  optimiseCoding: boolean;
  mozjpegOptions: {
    quality: number;
    progressive: boolean;
    trellis: boolean;
    overshootDeringing: boolean;
    optimiseScans: boolean;
    quantisationTable: number;
  };
}

/**
 * Predefined image sizes for different use cases
 */
export const getImageSizes = (): ImageSizeConfig[] => [
  // Thumbnail - aggressive compression for admin previews
  {
    name: 'thumbnail',
    width: 150,
    height: 150,
    quality: 60,
    format: 'webp',
    fit: 'cover',
    withoutEnlargement: true,
  },
  // Small - for cards and small displays
  {
    name: 'small',
    width: 400,
    height: 300,
    quality: 70,
    format: 'webp',
    fit: 'cover',
    withoutEnlargement: true,
  },
  // Medium - for content areas
  {
    name: 'medium',
    width: 800,
    height: 600,
    quality: 75,
    format: 'webp',
    fit: 'cover',
    withoutEnlargement: true,
  },
  // Large - for hero images and galleries
  {
    name: 'large',
    width: 1200,
    height: 900,
    quality: 80,
    format: 'webp',
    fit: 'cover',
    withoutEnlargement: true,
  },
  // Extra Large - for high-resolution displays (optional)
  {
    name: 'xlarge',
    width: 1920,
    height: 1080,
    quality: 85,
    format: 'webp',
    fit: 'cover',
    withoutEnlargement: true,
  },
];

/**
 * Creates optimized Sharp configuration for serverless environments
 * Designed to minimize memory usage and processing time
 */
export const createServerlessSharpConfig = (): void => {
  // Disable Sharp cache to prevent memory buildup in serverless
  sharp.cache(false);
  
  // Set strict concurrency limits for serverless
  sharp.concurrency(1);
  
  // Disable SIMD to reduce memory footprint
  sharp.simd(false);
  
  // Log configuration in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[SHARP-CONFIG] Serverless Sharp configuration applied:');
    console.log('[SHARP-CONFIG] - Cache: disabled');
    console.log('[SHARP-CONFIG] - Concurrency: 1');
    console.log('[SHARP-CONFIG] - SIMD: disabled');
    console.log('[SHARP-CONFIG] - Memory optimization: enabled');
  }
};

/**
 * Creates Sharp instance with serverless-optimized defaults
 * @param input Buffer or path to image
 * @returns Configured Sharp instance
 */
export const createOptimizedSharpInstance = (input: Buffer | string): Sharp => {
  return sharp(input, {
    // Limit input pixels to prevent memory exhaustion (7000x7000 = 49M pixels)
    limitInputPixels: 49_000_000,
    // Use sequential read to reduce memory usage
    sequentialRead: true,
    // Set default density for consistent output
    density: 72,
    // Process only first page of multi-page formats
    pages: 1,
    page: 0,
  });
};

/**
 * Gets Sharp options optimized for web delivery
 * @param format Target format
 * @param quality Quality setting (1-100)
 * @returns Sharp format options
 */
export const getWebOptimizedFormatOptions = (
  format: 'webp' | 'jpeg' | 'png',
  quality: number = 80
): any => {
  switch (format) {
    case 'webp':
      return {
        webp: {
          quality,
          effort: 4, // Balance between compression and speed
          lossless: false,
          nearLossless: false,
          smartSubsample: true,
          preset: 'default',
        },
      };
    
    case 'jpeg':
      return {
        jpeg: {
          quality,
          progressive: true,
          mozjpeg: true, // Use mozjpeg for better compression
          trellisQuantisation: true,
          overshootDeringing: true,
          optimiseScans: true,
          quantisationTable: 3,
        },
      };
    
    case 'png':
      return {
        png: {
          quality,
          palette: true,
          compressionLevel: 9,
          adaptiveFiltering: true,
          progressive: false,
        },
      };
    
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
};

/**
 * Gets resize options optimized for serverless processing
 * @param config Image size configuration
 * @returns Sharp resize options
 */
export const getServerlessResizeOptions = (config: ImageSizeConfig): any => {
  return {
    width: config.width,
    height: config.height,
    fit: config.fit,
    withoutEnlargement: config.withoutEnlargement,
    // Use cubic kernel for good quality/speed balance
    kernel: 'cubic',
    // Disable fastShrinkOnLoad for consistent results
    fastShrinkOnLoad: false,
  };
};

/**
 * Memory usage tracking for Sharp operations
 */
export class SharpMemoryTracker {
  private static instance: SharpMemoryTracker;
  private memoryUsage: Map<string, number> = new Map();
  private readonly maxMemoryMB: number = 128; // 128MB limit for serverless

  static getInstance(): SharpMemoryTracker {
    if (!SharpMemoryTracker.instance) {
      SharpMemoryTracker.instance = new SharpMemoryTracker();
    }
    return SharpMemoryTracker.instance;
  }

  /**
   * Records memory usage for an operation
   * @param operationId Unique identifier for the operation
   * @param memoryMB Memory usage in MB
   */
  recordMemoryUsage(operationId: string, memoryMB: number): void {
    this.memoryUsage.set(operationId, memoryMB);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SHARP-MEMORY] Operation ${operationId}: ${memoryMB}MB`);
    }
  }

  /**
   * Checks if memory usage is within limits
   * @param memoryMB Current memory usage in MB
   * @returns True if within limits
   */
  isWithinMemoryLimits(memoryMB: number): boolean {
    return memoryMB <= this.maxMemoryMB;
  }

  /**
   * Gets current memory statistics
   * @returns Memory usage statistics
   */
  getMemoryStats(): { current: number; max: number; operations: number } {
    const totalMemory = Array.from(this.memoryUsage.values()).reduce((sum, mem) => sum + mem, 0);
    return {
      current: totalMemory,
      max: this.maxMemoryMB,
      operations: this.memoryUsage.size,
    };
  }

  /**
   * Clears memory usage tracking
   */
  clear(): void {
    this.memoryUsage.clear();
  }
}

/**
 * Initialize Sharp for serverless environment
 * Call this once at application startup
 */
export const initializeSharpForServerless = (): void => {
  try {
    createServerlessSharpConfig();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[SHARP-CONFIG] Sharp initialized for serverless environment');
      console.log('[SHARP-CONFIG] Available image sizes:', getImageSizes().map(s => s.name).join(', '));
    }
  } catch (error) {
    console.error('[SHARP-CONFIG] Failed to initialize Sharp for serverless:', error);
    throw error;
  }
};