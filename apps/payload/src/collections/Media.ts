import type { CollectionConfig } from 'payload'

import { validateImageForProcessing, isFileSizeValid } from '../lib/image-validators'
import { getSharpAdapter } from '../lib/serverless-sharp-adapter'
import { getPlatformConfig, getSharpPlatformSettings } from '../lib/platform-optimizations'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'filename',
  },
  upload: {
    // Specify allowed MIME types for media
    mimeTypes: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'video/mp4',
      'video/quicktime',
      'video/webm',
    ],
    // Require file on create to prevent null filenames
    filesRequiredOnCreate: true,
    
    // Admin thumbnail for immediate preview
    // Uses minimal processing to avoid timeouts in admin interface
    adminThumbnail: ({ doc }) => {
      // Only generate thumbnails for images
      const mimeType = doc?.mimeType as string;
      if (mimeType?.startsWith('image/') && mimeType !== 'image/svg+xml') {
        return `thumbnail_${doc.filename || 'image'}`
      }
      return false
    },
    
    // Disable local storage - using R2 cloud storage
    disableLocalStorage: true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Alternative text for accessibility and SEO',
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: {
        description: 'Optional caption for the media',
      },
    },
    {
      name: 'type',
      type: 'select',
      options: [
        {
          label: 'Image',
          value: 'image',
        },
        {
          label: 'Video',
          value: 'video',
        },
        {
          label: 'Document',
          value: 'document',
        },
      ],
      admin: {
        description: 'Type of media file',
      },
    },
    {
      name: 'tags',
      type: 'array',
      label: 'Tags',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
      admin: {
        description: 'Tags for organizing and searching media',
      },
    },
    {
      name: 'processingStatus',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
      ],
      defaultValue: 'pending',
      admin: {
        description: 'Status of image processing',
        readOnly: true,
      },
    },
    {
      name: 'processingError',
      type: 'text',
      admin: {
        description: 'Error message if processing failed',
        readOnly: true,
        condition: (data) => data.processingStatus === 'failed',
      },
    },
    {
      name: 'sharpMetadata',
      type: 'json',
      admin: {
        description: 'Sharp processing metadata (internal use)',
        readOnly: true,
        hidden: true,
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        try {
          // Ensure data exists
          if (!data) {
            console.error('[Media] beforeChange: data is undefined');
            return data;
          }

          // Auto-detect file type based on MIME type if not set
          if (req.file && !data.type) {
            const mimeType = req.file.mimetype;
            if (mimeType.startsWith('image/')) {
              data.type = 'image';
            } else if (mimeType.startsWith('video/')) {
              data.type = 'video';
            } else {
              data.type = 'document';
            }
          }

          // Ensure filename is present before saving
          if (!data.filename && req.file) {
            data.filename = req.file.name;
          }

          // Validate image files for serverless processing
          if (req.file && data.type === 'image') {
            console.log(`[Media] Validating image file: ${req.file.name}`);
            
            // Quick file size validation first
            const platformConfig = getPlatformConfig();
            const sizeValid = isFileSizeValid(req.file, platformConfig.recommendedImageSizeLimitMB);
            if (!sizeValid) {
              throw new Error(`File size exceeds ${platformConfig.recommendedImageSizeLimitMB}MB limit for serverless processing`);
            }

            // Comprehensive image validation
            const imageValidation = await validateImageForProcessing(req.file);
            if (!imageValidation.isValid) {
              const errorMessage = imageValidation.errors.join(', ');
              console.warn(`[Media] Image validation failed: ${errorMessage}`);
              data.processingStatus = 'failed';
              data.processingError = errorMessage;
            } else {
              data.processingStatus = 'pending';
              data.processingError = undefined;
              
              // Store validation metadata for later use
              if (imageValidation.metadata) {
                data.sharpMetadata = imageValidation.metadata;
              }
              
              // Log warnings if any
              if (imageValidation.warnings.length > 0) {
                console.warn(`[Media] Image validation warnings: ${imageValidation.warnings.join(', ')}`);
              }
            }
          }

          return data;
        } catch (error) {
          console.error('[Media] beforeChange hook error:', error);
          // Set error status but don't block upload entirely
          if (data) {
            data.processingStatus = 'failed';
            data.processingError = error instanceof Error ? error.message : 'Unknown validation error';
          }
          return data;
        }
      },
    ],
    afterChange: [
      async ({ doc, req, previousDoc, operation }) => {
        try {
          // Only process images on create or when file changes
          if (operation === 'create' || 
              (operation === 'update' && doc.filename !== previousDoc?.filename)) {
            
            if (doc.type === 'image' && doc.mimeType?.startsWith('image/') && doc.processingStatus === 'pending') {
              console.log(`[Media] Processing completed for: ${doc.filename}`);
              
              // Mark as completed since basic upload succeeded
              // No additional Sharp processing needed for admin interface
              const updatedData: Partial<typeof doc> = {
                processingStatus: 'completed',
                processingError: undefined,
              };

              // Update the document with completion status
              await req.payload.update({
                collection: 'media',
                id: doc.id,
                data: updatedData,
              });

              console.log(`[Media] Processing status updated for: ${doc.filename}`);
            }
          }
        } catch (error) {
          console.error('[Media] afterChange hook error:', error);
          
          // Update document with error status
          try {
            const errorData: Partial<typeof doc> = {
              processingStatus: 'failed',
              processingError: error instanceof Error ? error.message : 'Background processing failed',
            };

            await req.payload.update({
              collection: 'media',
              id: doc.id,
              data: errorData,
            });
          } catch (updateError) {
            console.error('[Media] Failed to update error status:', updateError);
          }
        }
      },
    ],
    beforeValidate: [
      async ({ data, req }) => {
        // Ensure data exists
        if (!data) {
          console.error('[Media] beforeValidate: data is undefined');
          return data;
        }

        // Initialize serverless Sharp adapter when needed
        if (req.file && data.type === 'image') {
          try {
            const sharpAdapter = getSharpAdapter();
            const platformSettings = getSharpPlatformSettings();
            
            // Log platform-specific settings in development
            if (process.env.NODE_ENV === 'development') {
              console.log('[Media] Sharp adapter initialized with settings:', {
                platform: getPlatformConfig().name,
                memoryLimitMB: getPlatformConfig().maxMemoryMB,
                timeoutMs: getPlatformConfig().maxTimeoutMs,
                ...platformSettings,
              });
            }

            // Check adapter health before processing
            if (!sharpAdapter.isHealthy()) {
              console.warn('[Media] Sharp adapter is not healthy, may impact processing');
            }
          } catch (error) {
            console.error('[Media] Failed to initialize Sharp adapter:', error);
          }
        }
        return data;
      },
    ],
  },
}
