/**
 * Creates the necessary fallback files and directory structure
 * These files will be served when actual S3 files are missing
 */
import fs from 'fs';
import path from 'path';
/**
 * Creates the necessary fallback files and directory structure
 * These files will be served when actual S3 files are missing
 */
export async function createS3Fallbacks() {
    const results = {
        createdFallbacks: 0,
        errors: [],
    };
    try {
        // Use our separate script to create fallback files
        // This has been proven to work correctly
        const createFallbackFilesPath = path.resolve(__dirname, './create-fallback-files.js');
        // Execute the script to create fallback files
        const { execSync } = await import('child_process');
        try {
            console.log('Creating fallback files...');
            execSync(`tsx ${createFallbackFilesPath}`, { stdio: 'inherit' });
            results.createdFallbacks += 2; // Count both files
        }
        catch (error) {
            console.error('Error creating fallback files:', error);
            console.log('Will continue with middleware setup anyway');
        }
        // Install the middleware in Payload config
        await setupMiddlewareInPayloadConfig();
        results.createdFallbacks++;
        return results;
    }
    catch (error) {
        console.error('Error creating S3 fallbacks:', error);
        results.errors.push(`Error: ${error.message}`);
        return results;
    }
}
/**
 * Updates the Payload config to use the S3 fallback middleware
 */
async function setupMiddlewareInPayloadConfig() {
    // Path to Payload config
    const payloadConfigPath = path.resolve(__dirname, '../../../../../apps/payload/src/payload.config.ts');
    // Create the middleware file if it doesn't exist
    const middlewarePath = path.resolve(__dirname, '../../../../../apps/payload/src/middleware/s3-fallback-middleware.ts');
    const middlewareDir = path.dirname(middlewarePath);
    if (!fs.existsSync(middlewareDir)) {
        fs.mkdirSync(middlewareDir, { recursive: true });
    }
    // Write the middleware file content
    if (!fs.existsSync(middlewarePath)) {
        const middlewareContent = `
import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

// Fallback paths
const FALLBACKS = {
  thumbnail: path.resolve(__dirname, '../../../packages/content-migrations/src/data/fallbacks/thumbnail-placeholder.webp'),
  pdf: path.resolve(__dirname, '../../../packages/content-migrations/src/data/fallbacks/download-placeholder.pdf'),
}

/**
 * Middleware to handle S3 NoSuchKey errors with fallback files
 */
export const s3FallbackMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Store original send method to intercept responses
  const originalSend = res.send;
  
  // Override send method to check for S3 errors
  res.send = function(body) {
    // Check if this is an S3 error response
    if (typeof body === 'string' && 
        (body.includes('NoSuchKey') || body.includes('AccessDenied')) && 
        res.statusCode >= 400) {
      
      // Determine what type of file was requested
      const url = req.originalUrl || req.url;
      let fallbackType = 'thumbnail';
      
      if (url.includes('.pdf') || url.includes('/downloads/')) {
        fallbackType = 'pdf';
      }
      
      // Serve the appropriate fallback file
      try {
        const fallbackPath = FALLBACKS[fallbackType];
        if (fs.existsSync(fallbackPath)) {
          const fallbackContent = fs.readFileSync(fallbackPath);
          
          // Set status and content type
          res.status(200);
          res.type(fallbackType === 'pdf' ? 'application/pdf' : 'image/webp');
          
          // Log for monitoring
          console.log(\`Serving fallback for \${url} (type: \${fallbackType})\`);
          
          // Send fallback content using original method
          return originalSend.call(this, fallbackContent);
        }
      } catch (error) {
        console.error('Error serving fallback:', error);
      }
    }
    
    // Default behavior if no fallback was served
    return originalSend.call(this, body);
  };
  
  next();
};
`;
        fs.writeFileSync(middlewarePath, middlewareContent);
    }
    // Update Payload config to use the middleware
    if (fs.existsSync(payloadConfigPath)) {
        let configContent = fs.readFileSync(payloadConfigPath, 'utf8');
        // Only update if not already using the middleware
        if (!configContent.includes('s3FallbackMiddleware')) {
            // Add import for the middleware
            configContent = configContent.replace(/import.*;/g, (match) => `${match}\nimport { s3FallbackMiddleware } from './middleware/s3-fallback-middleware';`);
            // Add middleware to express config
            if (configContent.includes('express: {')) {
                // If express config already exists
                configContent = configContent.replace(/express:\s*{/, 'express: {\n  middleware: [s3FallbackMiddleware],');
            }
            else {
                // If no express config exists
                configContent = configContent.replace(/export default buildConfig\({/, 'export default buildConfig({\n  express: {\n    middleware: [s3FallbackMiddleware],\n  },');
            }
            fs.writeFileSync(payloadConfigPath, configContent);
        }
    }
}
// Run the script when executed directly
// Use ES module pattern instead of CommonJS
const isMainModule = import.meta.url.endsWith(process.argv[1]);
if (isMainModule) {
    createS3Fallbacks()
        .then((results) => {
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
    })
        .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
}
