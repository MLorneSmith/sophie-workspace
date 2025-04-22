/**
 * Enhanced R2 adapter for Payload CMS
 *
 * This module provides a properly configured S3 client for use with Cloudflare R2
 * It includes direct S3 client access for utility functions
 */
import { S3Client } from '@aws-sdk/client-s3'

// Initialize S3 client with R2 credentials
const s3Client = new S3Client({
  region: process.env.R2_REGION || 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true, // Required for R2 compatibility
})

/**
 * Create R2 storage configuration for Payload
 * This is meant to be imported and used in the payload.config.ts file
 *
 * Example:
 * import { createR2StorageConfig } from './utils/r2-adapter'
 *
 * export default buildConfig({
 *   // other config
 *   plugins: [createR2StorageConfig()]
 * })
 */
export const createR2StorageConfig = () => {
  try {
    // Dynamic import to avoid errors if package is not installed
    const { s3Storage } = require('@payloadcms/storage-s3')

    return s3Storage({
      collections: {
        downloads: {
          adapter: 's3',
          disableLocalStorage: true,
          prefix: 'downloads',
          generateFileURL: ({ filename, prefix }: { filename: string; prefix: string }) =>
            `https://downloads.slideheroes.com/${encodeURIComponent(filename)}`,
        },
      },
      bucket: process.env.R2_BUCKET || 'media',
      config: {
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
        region: 'auto', // Required by Cloudflare R2
        forcePathStyle: true, // Required for R2 compatibility
      },
    })
  } catch (error) {
    console.error('Error creating R2 storage config:', error)
    // Return empty plugin array as fallback
    return []
  }
}

// Export the raw client for direct operations if needed
export const r2Client = s3Client
