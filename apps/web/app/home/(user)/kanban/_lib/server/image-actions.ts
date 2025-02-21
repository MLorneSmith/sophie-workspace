'use server';

import { del, put } from '@vercel/blob';

import { enhanceAction } from '@kit/next/actions';

export const uploadTaskImageAction = enhanceAction(
  async function (data: { file: File }, user) {
    try {
      const blob = await put(data.file.name, data.file, {
        access: 'public',
        addRandomSuffix: true,
        contentType: data.file.type,
      });

      return {
        success: true,
        error: null,
        data: {
          url: blob.url,
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
      await del(data.url);
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
