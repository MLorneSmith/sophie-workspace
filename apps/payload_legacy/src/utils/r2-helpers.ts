import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3'

// Initialize S3 client with R2 credentials
const s3Client = new S3Client({
  region: process.env.R2_REGION || 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true, // Required for R2
})

/**
 * Get file metadata directly from R2 storage
 * @param filename The filename in the R2 bucket
 * @returns Object with file metadata or null if not found
 */
export async function getRawR2FileInfo(filename: string) {
  try {
    const command = new HeadObjectCommand({
      Bucket: process.env.R2_BUCKET || '',
      Key: filename,
    })

    const response = await s3Client.send(command)
    return {
      size: response.ContentLength,
      contentType: response.ContentType,
      lastModified: response.LastModified,
      etag: response.ETag,
    }
  } catch (error) {
    console.error(`Error fetching R2 file info for ${filename}:`, error)
    return null
  }
}

/**
 * Check if a file exists in R2
 * @param filename The filename to check
 * @returns Boolean indicating if file exists
 */
export async function fileExistsInR2(filename: string) {
  try {
    const info = await getRawR2FileInfo(filename)
    return !!info
  } catch (error) {
    return false
  }
}
