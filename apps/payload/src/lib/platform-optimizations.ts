/**
 * Platform-specific configuration for serverless environments
 */
export interface PlatformConfig {
  name: string;
  maxMemoryMB: number;
  maxTimeoutMs: number;
  maxConcurrency: number;
  recommendedImageSizeLimitMB: number;
  recommendedMaxDimensions: {
    width: number;
    height: number;
  };
  sharpSettings: {
    cache: boolean;
    concurrency: number;
    simd: boolean;
  };
  optimizations: {
    useWebP: boolean;
    aggressiveCompression: boolean;
    stripMetadata: boolean;
    limitInputPixels: number;
  };
}

/**
 * Platform detection result
 */
export interface PlatformDetection {
  platform: 'vercel' | 'cloudflare' | 'aws-lambda' | 'netlify' | 'generic';
  isServerless: boolean;
  region?: string;
  runtime?: string;
  memoryLimit?: number;
  timeoutLimit?: number;
}

/**
 * Vercel platform configuration
 */
const getVercelConfig = (): PlatformConfig => ({
  name: 'Vercel',
  maxMemoryMB: 1024, // Vercel Pro/Team limits
  maxTimeoutMs: 30000, // 30 seconds for Hobby, 60s for Pro
  maxConcurrency: 1, // Serverless functions are stateless
  recommendedImageSizeLimitMB: 4.5, // Leave headroom for processing
  recommendedMaxDimensions: {
    width: 4000,
    height: 4000,
  },
  sharpSettings: {
    cache: false,
    concurrency: 1,
    simd: false, // Disable for consistent memory usage
  },
  optimizations: {
    useWebP: true,
    aggressiveCompression: true,
    stripMetadata: true,
    limitInputPixels: 16_000_000, // 4000x4000
  },
});

/**
 * Cloudflare Workers/Pages configuration
 */
const getCloudflareConfig = (): PlatformConfig => ({
  name: 'Cloudflare',
  maxMemoryMB: 128, // Cloudflare Workers memory limit
  maxTimeoutMs: 30000, // 30 seconds CPU time
  maxConcurrency: 1,
  recommendedImageSizeLimitMB: 2, // Very strict due to memory limits
  recommendedMaxDimensions: {
    width: 2000,
    height: 2000,
  },
  sharpSettings: {
    cache: false,
    concurrency: 1,
    simd: false,
  },
  optimizations: {
    useWebP: true,
    aggressiveCompression: true,
    stripMetadata: true,
    limitInputPixels: 4_000_000, // 2000x2000
  },
});

/**
 * AWS Lambda configuration
 */
const getAWSLambdaConfig = (): PlatformConfig => ({
  name: 'AWS Lambda',
  maxMemoryMB: 512, // Conservative default, can be higher
  maxTimeoutMs: 29000, // 29 seconds (API Gateway limit is 30s)
  maxConcurrency: 1,
  recommendedImageSizeLimitMB: 6,
  recommendedMaxDimensions: {
    width: 5000,
    height: 5000,
  },
  sharpSettings: {
    cache: false,
    concurrency: 1,
    simd: false,
  },
  optimizations: {
    useWebP: true,
    aggressiveCompression: true,
    stripMetadata: true,
    limitInputPixels: 25_000_000, // 5000x5000
  },
});

/**
 * Netlify Functions configuration
 */
const getNetlifyConfig = (): PlatformConfig => ({
  name: 'Netlify',
  maxMemoryMB: 256, // Netlify Functions limit
  maxTimeoutMs: 26000, // 26 seconds background, 10s synchronous
  maxConcurrency: 1,
  recommendedImageSizeLimitMB: 3,
  recommendedMaxDimensions: {
    width: 3000,
    height: 3000,
  },
  sharpSettings: {
    cache: false,
    concurrency: 1,
    simd: false,
  },
  optimizations: {
    useWebP: true,
    aggressiveCompression: true,
    stripMetadata: true,
    limitInputPixels: 9_000_000, // 3000x3000
  },
});

/**
 * Generic serverless configuration (conservative defaults)
 */
const getGenericConfig = (): PlatformConfig => ({
  name: 'Generic Serverless',
  maxMemoryMB: 256,
  maxTimeoutMs: 25000,
  maxConcurrency: 1,
  recommendedImageSizeLimitMB: 2,
  recommendedMaxDimensions: {
    width: 2000,
    height: 2000,
  },
  sharpSettings: {
    cache: false,
    concurrency: 1,
    simd: false,
  },
  optimizations: {
    useWebP: true,
    aggressiveCompression: true,
    stripMetadata: true,
    limitInputPixels: 4_000_000,
  },
});

/**
 * Detect the current platform based on environment variables
 */
export const detectPlatform = (): PlatformDetection => {
  // Vercel detection
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    return {
      platform: 'vercel',
      isServerless: true,
      region: process.env.VERCEL_REGION,
      runtime: process.env.AWS_EXECUTION_ENV,
      memoryLimit: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE ? 
        parseInt(process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE) : undefined,
      timeoutLimit: process.env.AWS_LAMBDA_FUNCTION_TIMEOUT ? 
        parseInt(process.env.AWS_LAMBDA_FUNCTION_TIMEOUT) * 1000 : undefined,
    };
  }

  // Cloudflare Workers detection
  if (process.env.CF_PAGES || process.env.CLOUDFLARE_ENV || 
      typeof globalThis.navigator !== 'undefined' && 
      globalThis.navigator.userAgent?.includes('Cloudflare-Workers')) {
    return {
      platform: 'cloudflare',
      isServerless: true,
      region: process.env.CF_REGION,
    };
  }

  // AWS Lambda detection
  if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_EXECUTION_ENV) {
    return {
      platform: 'aws-lambda',
      isServerless: true,
      region: process.env.AWS_REGION,
      runtime: process.env.AWS_EXECUTION_ENV,
      memoryLimit: process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE ? 
        parseInt(process.env.AWS_LAMBDA_FUNCTION_MEMORY_SIZE) : undefined,
      timeoutLimit: process.env.AWS_LAMBDA_FUNCTION_TIMEOUT ? 
        parseInt(process.env.AWS_LAMBDA_FUNCTION_TIMEOUT) * 1000 : undefined,
    };
  }

  // Netlify Functions detection
  if (process.env.NETLIFY || process.env.NETLIFY_DEV) {
    return {
      platform: 'netlify',
      isServerless: true,
      region: process.env.AWS_REGION, // Netlify uses AWS under the hood
    };
  }

  // Check for other serverless indicators
  const isServerless = !!(
    process.env.LAMBDA_TASK_ROOT ||
    process.env.FUNCTION_NAME ||
    process.env.GCLOUD_PROJECT ||
    process.env.K_SERVICE ||
    process.env.WEBSITE_SITE_NAME // Azure Functions
  );

  return {
    platform: 'generic',
    isServerless,
  };
};

/**
 * Get platform-specific configuration
 */
export const getPlatformConfig = (): PlatformConfig => {
  const detection = detectPlatform();
  
  // Allow environment variable overrides
  const envMemoryMB = process.env.SHARP_MEMORY_LIMIT_MB ? 
    parseInt(process.env.SHARP_MEMORY_LIMIT_MB) : undefined;
  const envTimeoutMs = process.env.SHARP_TIMEOUT_MS ? 
    parseInt(process.env.SHARP_TIMEOUT_MS) : undefined;
  const envMaxSizeMB = process.env.SHARP_MAX_FILE_SIZE_MB ? 
    parseInt(process.env.SHARP_MAX_FILE_SIZE_MB) : undefined;

  let baseConfig: PlatformConfig;

  switch (detection.platform) {
    case 'vercel':
      baseConfig = getVercelConfig();
      break;
    case 'cloudflare':
      baseConfig = getCloudflareConfig();
      break;
    case 'aws-lambda':
      baseConfig = getAWSLambdaConfig();
      break;
    case 'netlify':
      baseConfig = getNetlifyConfig();
      break;
    default:
      baseConfig = getGenericConfig();
  }

  // Apply environment overrides
  const config: PlatformConfig = {
    ...baseConfig,
    maxMemoryMB: envMemoryMB || detection.memoryLimit || baseConfig.maxMemoryMB,
    maxTimeoutMs: envTimeoutMs || detection.timeoutLimit || baseConfig.maxTimeoutMs,
    recommendedImageSizeLimitMB: envMaxSizeMB || baseConfig.recommendedImageSizeLimitMB,
  };

  // Log configuration in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[PLATFORM-CONFIG] Platform detected:', detection.platform);
    console.log('[PLATFORM-CONFIG] Configuration:', {
      memoryMB: config.maxMemoryMB,
      timeoutMs: config.maxTimeoutMs,
      maxFileSizeMB: config.recommendedImageSizeLimitMB,
      maxDimensions: config.recommendedMaxDimensions,
    });
  }

  return config;
};

/**
 * Get optimized Sharp settings for current platform
 */
export const getSharpPlatformSettings = (): {
  cache: boolean;
  concurrency: number;
  simd: boolean;
  limitInputPixels: number;
} => {
  const config = getPlatformConfig();
  
  return {
    cache: config.sharpSettings.cache,
    concurrency: config.sharpSettings.concurrency,
    simd: config.sharpSettings.simd,
    limitInputPixels: config.optimizations.limitInputPixels,
  };
};

/**
 * Get image validation constraints for current platform
 */
export const getPlatformImageConstraints = (): {
  maxFileSizeMB: number;
  maxWidth: number;
  maxHeight: number;
  allowedFormats: string[];
} => {
  const config = getPlatformConfig();
  
  return {
    maxFileSizeMB: config.recommendedImageSizeLimitMB,
    maxWidth: config.recommendedMaxDimensions.width,
    maxHeight: config.recommendedMaxDimensions.height,
    allowedFormats: config.optimizations.useWebP 
      ? ['webp', 'jpeg', 'png'] 
      : ['jpeg', 'png'],
  };
};

/**
 * Get processing timeout for current platform
 */
export const getPlatformTimeout = (): number => {
  const config = getPlatformConfig();
  
  // Reserve 5 seconds for other operations (upload, response, etc.)
  return Math.max(config.maxTimeoutMs - 5000, 10000);
};

/**
 * Check if current platform supports WebP
 */
export const isPlatformWebPCompatible = (): boolean => {
  const config = getPlatformConfig();
  return config.optimizations.useWebP;
};

/**
 * Get recommended processing queue size for current platform
 */
export const getPlatformQueueSize = (): number => {
  const config = getPlatformConfig();
  
  // For serverless, process one at a time to avoid memory issues
  return config.maxConcurrency;
};

/**
 * Initialize platform-specific optimizations
 */
export const initializePlatformOptimizations = (): void => {
  const detection = detectPlatform();
  const config = getPlatformConfig();
  
  // Set Node.js specific optimizations
  if (detection.isServerless) {
    // Increase max old space size if not set
    if (!process.env.NODE_OPTIONS?.includes('--max-old-space-size')) {
      const maxOldSpace = Math.min(config.maxMemoryMB - 64, 512); // Reserve 64MB for other operations
      process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --max-old-space-size=${maxOldSpace}`.trim();
    }
    
    // Enable garbage collection if available
    if (typeof global !== 'undefined' && !global.gc) {
      try {
        // Try to enable garbage collection
        if (process.env.NODE_OPTIONS && !process.env.NODE_OPTIONS.includes('--expose-gc')) {
          process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS} --expose-gc`.trim();
        }
      } catch (error) {
        // Silently ignore if we can't enable GC
      }
    }
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[PLATFORM-OPTIMIZATION] Platform optimizations initialized:', {
      platform: detection.platform,
      isServerless: detection.isServerless,
      memoryLimit: config.maxMemoryMB,
      timeoutLimit: config.maxTimeoutMs,
      nodeOptions: process.env.NODE_OPTIONS,
    });
  }
};

/**
 * Get platform-specific error handling recommendations
 */
export const getPlatformErrorHandling = (): {
  retryAttempts: number;
  retryDelay: number;
  fallbackToOriginal: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
} => {
  const detection = detectPlatform();
  
  if (detection.isServerless) {
    return {
      retryAttempts: 1, // Limited retries in serverless
      retryDelay: 100, // Quick retry
      fallbackToOriginal: true, // Fallback to original file if processing fails
      logLevel: 'warn', // Reduce logging in production
    };
  }
  
  return {
    retryAttempts: 3,
    retryDelay: 1000,
    fallbackToOriginal: false,
    logLevel: 'error',
  };
};

/**
 * Get environment-specific logging configuration
 */
export const getPlatformLogging = (): {
  enableDebugLogs: boolean;
  enablePerformanceLogs: boolean;
  enableMemoryLogs: boolean;
  logFormat: 'json' | 'text';
} => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const detection = detectPlatform();
  
  return {
    enableDebugLogs: isDevelopment || process.env.SHARP_DEBUG === 'true',
    enablePerformanceLogs: isDevelopment || process.env.SHARP_PERF_LOGS === 'true',
    enableMemoryLogs: isDevelopment || detection.isServerless,
    logFormat: detection.isServerless ? 'json' : 'text',
  };
};

/**
 * Validate current environment meets platform requirements
 */
export const validatePlatformRequirements = (): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} => {
  const result = {
    isValid: true,
    warnings: [] as string[],
    errors: [] as string[],
  };
  
  const detection = detectPlatform();
  const config = getPlatformConfig();
  
  // Check if Sharp is available
  try {
    require('sharp');
  } catch (error) {
    result.isValid = false;
    result.errors.push('Sharp is not installed or not compatible with current platform');
  }
  
  // Check memory configuration
  if (detection.memoryLimit && detection.memoryLimit < config.maxMemoryMB) {
    result.warnings.push(
      `Platform memory limit (${detection.memoryLimit}MB) is lower than recommended (${config.maxMemoryMB}MB)`
    );
  }
  
  // Check timeout configuration
  if (detection.timeoutLimit && detection.timeoutLimit < config.maxTimeoutMs) {
    result.warnings.push(
      `Platform timeout limit (${detection.timeoutLimit}ms) is lower than recommended (${config.maxTimeoutMs}ms)`
    );
  }
  
  // Platform-specific checks
  if (detection.platform === 'cloudflare' && config.maxMemoryMB > 128) {
    result.warnings.push('Cloudflare Workers have strict 128MB memory limits');
  }
  
  return result;
};