import sharp from 'sharp';

/**
 * Image validation result interface
 */
export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: {
    width?: number;
    height?: number;
    format?: string;
    size: number;
    aspectRatio?: number;
  };
}

/**
 * Image validation configuration
 */
export interface ImageValidationConfig {
  maxFileSizeMB: number;
  maxWidth: number;
  maxHeight: number;
  minWidth: number;
  minHeight: number;
  allowedFormats: string[];
  allowedMimeTypes: string[];
  requireAspectRatio?: {
    min: number;
    max: number;
  };
}

/**
 * File input type that can be from various sources
 */
export interface FileInput {
  buffer?: Buffer;
  data?: Buffer | ArrayBuffer | Uint8Array;
  size?: number;
  mimeType?: string;
  mimetype?: string;
  filename?: string;
}

/**
 * Default validation configuration for serverless environments
 */
export const getDefaultValidationConfig = (): ImageValidationConfig => ({
  maxFileSizeMB: 10, // 10MB limit to prevent memory issues
  maxWidth: 7000, // Maximum width to prevent processing timeouts
  maxHeight: 7000, // Maximum height to prevent processing timeouts
  minWidth: 50, // Minimum useful width
  minHeight: 50, // Minimum useful height
  allowedFormats: ['jpeg', 'jpg', 'png', 'webp', 'gif', 'svg'],
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
  ],
  requireAspectRatio: {
    min: 0.1, // Very wide images (1:10)
    max: 10.0, // Very tall images (10:1)
  },
});

/**
 * Strict validation configuration for production serverless
 */
export const getStrictValidationConfig = (): ImageValidationConfig => ({
  maxFileSizeMB: 5, // Stricter file size limit
  maxWidth: 4000, // Stricter dimension limits
  maxHeight: 4000,
  minWidth: 100,
  minHeight: 100,
  allowedFormats: ['jpeg', 'jpg', 'png', 'webp'], // No GIF/SVG for strict mode
  allowedMimeTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ],
  requireAspectRatio: {
    min: 0.2, // Reasonable aspect ratios only
    max: 5.0,
  },
});

/**
 * Validates image file for serverless processing
 * @param file File data or Buffer
 * @param config Optional validation configuration
 * @returns Promise<ImageValidationResult>
 */
export const validateImageForProcessing = async (
  file: FileInput | Buffer,
  config: ImageValidationConfig = getDefaultValidationConfig()
): Promise<ImageValidationResult> => {
  const result: ImageValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  try {
    // Handle different input types
    let buffer: Buffer;
    let fileSize: number;
    let mimeType: string | undefined;

    if (Buffer.isBuffer(file)) {
      buffer = file;
      fileSize = buffer.length;
      mimeType = undefined; // Will be detected by Sharp
    } else {
      // FileInput from various sources
      if (file.buffer) {
        buffer = file.buffer;
        fileSize = file.size || buffer.length;
      } else if (file.data) {
        if (Buffer.isBuffer(file.data)) {
          buffer = file.data;
        } else if (file.data instanceof ArrayBuffer) {
          buffer = Buffer.from(file.data);
        } else if (file.data instanceof Uint8Array) {
          buffer = Buffer.from(file.data);
        } else {
          buffer = Buffer.from(file.data as any);
        }
        fileSize = file.size || buffer.length;
      } else {
        result.isValid = false;
        result.errors.push('No file data provided');
        return result;
      }
      
      mimeType = file.mimeType || file.mimetype;
    }

    // Validate file size
    const fileSizeMB = fileSize / (1024 * 1024);
    if (fileSizeMB > config.maxFileSizeMB) {
      result.isValid = false;
      result.errors.push(
        `File size ${fileSizeMB.toFixed(2)}MB exceeds maximum allowed size of ${config.maxFileSizeMB}MB`
      );
    }

    // Add warning for large files that might cause performance issues
    if (fileSizeMB > config.maxFileSizeMB * 0.8) {
      result.warnings.push(
        `Large file size ${fileSizeMB.toFixed(2)}MB may cause processing delays`
      );
    }

    // Validate MIME type if available
    if (mimeType && !config.allowedMimeTypes.includes(mimeType)) {
      result.isValid = false;
      result.errors.push(
        `MIME type ${mimeType} is not allowed. Allowed types: ${config.allowedMimeTypes.join(', ')}`
      );
    }

    // Use Sharp to validate and get image metadata
    let sharpInstance: sharp.Sharp;
    let metadata: sharp.Metadata;

    try {
      sharpInstance = sharp(buffer, {
        limitInputPixels: config.maxWidth * config.maxHeight * 4, // RGBA channels
        sequentialRead: true,
        density: 72,
      });
      
      metadata = await sharpInstance.metadata();
    } catch (sharpError: any) {
      result.isValid = false;
      result.errors.push(`Invalid image format or corrupted file: ${sharpError.message}`);
      return result;
    }

    // Validate image format
    if (metadata.format && !config.allowedFormats.includes(metadata.format)) {
      result.isValid = false;
      result.errors.push(
        `Image format ${metadata.format} is not allowed. Allowed formats: ${config.allowedFormats.join(', ')}`
      );
    }

    // Validate dimensions
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (width === 0 || height === 0) {
      result.isValid = false;
      result.errors.push('Could not determine image dimensions');
      return result;
    }

    if (width > config.maxWidth) {
      result.isValid = false;
      result.errors.push(
        `Image width ${width}px exceeds maximum allowed width of ${config.maxWidth}px`
      );
    }

    if (height > config.maxHeight) {
      result.isValid = false;
      result.errors.push(
        `Image height ${height}px exceeds maximum allowed height of ${config.maxHeight}px`
      );
    }

    if (width < config.minWidth) {
      result.isValid = false;
      result.errors.push(
        `Image width ${width}px is below minimum required width of ${config.minWidth}px`
      );
    }

    if (height < config.minHeight) {
      result.isValid = false;
      result.errors.push(
        `Image height ${height}px is below minimum required height of ${config.minHeight}px`
      );
    }

    // Calculate and validate aspect ratio
    const aspectRatio = width / height;
    
    if (config.requireAspectRatio) {
      if (aspectRatio < config.requireAspectRatio.min || aspectRatio > config.requireAspectRatio.max) {
        result.warnings.push(
          `Aspect ratio ${aspectRatio.toFixed(2)} may not be optimal for display. ` +
          `Recommended range: ${config.requireAspectRatio.min}-${config.requireAspectRatio.max}`
        );
      }
    }

    // Check for very large pixel count that might cause memory issues
    const totalPixels = width * height;
    const maxPixels = config.maxWidth * config.maxHeight * 0.5; // 50% of theoretical max
    
    if (totalPixels > maxPixels) {
      result.warnings.push(
        `Large image dimensions (${width}x${height}) may cause processing delays in serverless environment`
      );
    }

    // Add metadata to result
    result.metadata = {
      width,
      height,
      format: metadata.format,
      size: fileSize,
      aspectRatio,
    };

    // Log validation results in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[IMAGE-VALIDATOR] Validation completed:', {
        isValid: result.isValid,
        errors: result.errors.length,
        warnings: result.warnings.length,
        metadata: result.metadata,
      });
    }

    return result;

  } catch (error: any) {
    result.isValid = false;
    result.errors.push(`Validation failed: ${error.message}`);
    
    console.error('[IMAGE-VALIDATOR] Validation error:', error);
    return result;
  }
};

/**
 * Quick file size validation (without Sharp processing)
 * @param file File data
 * @param maxSizeMB Maximum size in MB
 * @returns boolean
 */
export const isFileSizeValid = (
  file: FileInput | Buffer,
  maxSizeMB: number = 10
): boolean => {
  let fileSize: number;

  if (Buffer.isBuffer(file)) {
    fileSize = file.length;
  } else {
    if (file.size) {
      fileSize = file.size;
    } else if (file.buffer) {
      fileSize = file.buffer.length;
    } else if (file.data) {
      if (Buffer.isBuffer(file.data)) {
        fileSize = file.data.length;
      } else {
        fileSize = Buffer.byteLength(file.data as any);
      }
    } else {
      return false;
    }
  }

  return fileSize <= maxSizeMB * 1024 * 1024;
};

/**
 * Quick MIME type validation
 * @param mimeType MIME type to validate
 * @param allowedTypes Optional array of allowed MIME types
 * @returns boolean
 */
export const isMimeTypeValid = (
  mimeType: string,
  allowedTypes: string[] = getDefaultValidationConfig().allowedMimeTypes
): boolean => {
  return allowedTypes.includes(mimeType);
};

/**
 * Validates image metadata for serverless processing constraints
 * @param metadata Sharp metadata object
 * @param config Validation configuration
 * @returns ImageValidationResult
 */
export const validateImageMetadata = (
  metadata: sharp.Metadata,
  config: ImageValidationConfig = getDefaultValidationConfig()
): Pick<ImageValidationResult, 'isValid' | 'errors' | 'warnings'> => {
  const result = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[],
  };

  const width = metadata.width || 0;
  const height = metadata.height || 0;

  // Validate dimensions
  if (width > config.maxWidth || height > config.maxHeight) {
    result.isValid = false;
    result.errors.push(
      `Image dimensions ${width}x${height} exceed maximum allowed ${config.maxWidth}x${config.maxHeight}`
    );
  }

  // Check for memory-intensive images
  const channels = metadata.channels || 3;
  const estimatedMemoryMB = (width * height * channels) / (1024 * 1024);
  
  if (estimatedMemoryMB > 50) { // 50MB estimated processing memory
    result.warnings.push(
      `Image may require ${estimatedMemoryMB.toFixed(1)}MB memory for processing`
    );
  }

  return result;
};

/**
 * Creates a validation error message for UI display
 * @param validationResult Validation result
 * @returns Formatted error message
 */
export const formatValidationErrors = (validationResult: ImageValidationResult): string => {
  if (validationResult.isValid) {
    return '';
  }

  const errors = validationResult.errors.join('; ');
  const warnings = validationResult.warnings.length > 0 
    ? ` Warnings: ${validationResult.warnings.join('; ')}`
    : '';

  return `${errors}${warnings}`;
};

/**
 * Helper function for Payload CMS upload validation
 * This can be used in Payload CMS upload hooks
 * @param file Express.Multer.File or similar file object
 * @returns Promise<boolean>
 */
export const payloadImageValidator = async (file: {
  buffer?: Buffer;
  size?: number;
  mimetype?: string;
  filename?: string;
}): Promise<boolean> => {
  try {
    const fileInput: FileInput = {
      buffer: file.buffer,
      size: file.size,
      mimetype: file.mimetype,
      filename: file.filename,
    };
    
    const result = await validateImageForProcessing(fileInput);
    
    if (!result.isValid) {
      // Log errors for debugging
      console.warn('[PAYLOAD-IMAGE-VALIDATOR] Validation failed:', result.errors);
    }
    
    return result.isValid;
  } catch (error) {
    console.error('[PAYLOAD-IMAGE-VALIDATOR] Validation error:', error);
    return false;
  }
};

/**
 * Validates buffer directly (useful for preprocessing)
 * @param buffer Image buffer
 * @param config Validation configuration
 * @returns Promise<ImageValidationResult>
 */
export const validateImageBuffer = async (
  buffer: Buffer,
  config: ImageValidationConfig = getDefaultValidationConfig()
): Promise<ImageValidationResult> => {
  return await validateImageForProcessing(buffer, config);
};

/**
 * Pre-validation check for basic constraints before expensive operations
 * @param file File input
 * @param config Validation configuration
 * @returns Basic validation result
 */
export const preValidateImage = (
  file: FileInput | Buffer,
  config: ImageValidationConfig = getDefaultValidationConfig()
): Pick<ImageValidationResult, 'isValid' | 'errors'> => {
  const result = {
    isValid: true,
    errors: [] as string[],
  };

  // Quick file size check
  if (!isFileSizeValid(file, config.maxFileSizeMB)) {
    result.isValid = false;
    result.errors.push(`File size exceeds ${config.maxFileSizeMB}MB limit`);
  }

  // Quick MIME type check
  if (!Buffer.isBuffer(file)) {
    const mimeType = file.mimeType || file.mimetype;
    if (mimeType && !isMimeTypeValid(mimeType, config.allowedMimeTypes)) {
      result.isValid = false;
      result.errors.push(`MIME type ${mimeType} not allowed`);
    }
  }

  return result;
};