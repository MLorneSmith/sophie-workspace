'use server';

import { randomUUID } from 'crypto';

import { enhanceAction } from '@kit/next/actions';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

// Define a type for the createPolicy method
interface StoragePolicy {
  name: string;
  allowed_operations: string[];
  definition: string;
}

// Define a type for the storage bucket with createPolicy method
interface StorageBucketWithPolicy {
  createPolicy(
    policy: StoragePolicy,
  ): Promise<{ data: unknown; error: unknown }>;
}

const BUCKET_NAME = 'task-images';
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];
const MAX_FILE_SIZE = 1024 * 1024; // 1MB

export const uploadTaskImageAction = enhanceAction(
  async function (data: { file: File }, user) {
    try {
      // Validate file
      if (!ALLOWED_MIME_TYPES.includes(data.file.type)) {
        throw new Error('Invalid file type. Only images are allowed.');
      }
      if (data.file.size > MAX_FILE_SIZE) {
        throw new Error('File size too large. Maximum size is 1MB.');
      }

      // Use admin client for bucket operations
      const adminClient = getSupabaseServerAdminClient();
      const { data: buckets } = await adminClient.storage.listBuckets();
      if (!buckets?.find((b) => b.name === BUCKET_NAME)) {
        // Create bucket
        const { error: bucketError } = await adminClient.storage.createBucket(
          BUCKET_NAME,
          {
            public: false,
            fileSizeLimit: MAX_FILE_SIZE,
          },
        );
        if (bucketError) throw bucketError;

        // Enable RLS and create policies using admin client
        // Create upload policy
        await (
          adminClient.storage.from(
            BUCKET_NAME,
          ) as unknown as StorageBucketWithPolicy
        ).createPolicy({
          name: 'Allow users to upload files',
          allowed_operations: ['INSERT'],
          definition: `bucket_id = '${BUCKET_NAME}' AND (storage.foldername(name))[1] = auth.uid()::text`,
        });

        // Create read policy
        await (
          adminClient.storage.from(
            BUCKET_NAME,
          ) as unknown as StorageBucketWithPolicy
        ).createPolicy({
          name: 'Allow users to read files',
          allowed_operations: ['SELECT'],
          definition: `bucket_id = '${BUCKET_NAME}'`,
        });

        // Create delete policy
        await (
          adminClient.storage.from(
            BUCKET_NAME,
          ) as unknown as StorageBucketWithPolicy
        ).createPolicy({
          name: 'Allow users to delete their own files',
          allowed_operations: ['DELETE'],
          definition: `bucket_id = '${BUCKET_NAME}' AND (storage.foldername(name))[1] = auth.uid()::text`,
        });
      }

      // Use regular client for file operations
      const client = getSupabaseServerClient();
      const fileExt = data.file.name.split('.').pop();
      const fileName = `${user.id}/${randomUUID()}.${fileExt}`;

      const { data: _uploadData, error: uploadError } = await client.storage
        .from(BUCKET_NAME)
        .upload(fileName, data.file, {
          upsert: false,
          contentType: data.file.type,
        });

      if (uploadError) throw uploadError;

      const { data: signedData, error: signedError } = await client.storage
        .from(BUCKET_NAME)
        .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days

      if (signedError || !signedData) {
        throw new Error('Failed to create signed URL');
      }

      return {
        success: true,
        error: null,
        data: {
          url: signedData.signedUrl,
        },
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to upload image',
        data: null,
      };
    }
  },
  {
    auth: true,
  },
);

export const deleteTaskImageAction = enhanceAction(
  async function (data: { url: string }, user) {
    try {
      const client = getSupabaseServerClient();

      // Extract path from signed URL
      const url = new URL(data.url);
      const path = url.pathname.split('/').pop();
      if (!path) throw new Error('Invalid file URL');

      const filePath = `${user.id}/${path}`;

      const { error } = await client.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) throw error;

      return {
        success: true,
        error: null,
      };
    } catch (error) {
      console.error('Error deleting image:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete image',
      };
    }
  },
  {
    auth: true,
  },
);
