import { z } from 'zod';

export const DownloadDefinitionSchema = z.object({
  id: z.string().uuid(),
  key: z.string().min(1),
  title: z.string().min(1),
  filename: z.string().min(1),
  description: z.string().optional(),
  url: z.string().url(),
  type: z.enum(['pdf', 'zip', 'png', 'jpg', 'webp', 'mdoc', 'yaml', 'html', 'json', 'ts', 'other']), // Added more types based on raw content
  altText: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const DownloadDefinitionsSchema = z.array(DownloadDefinitionSchema);
