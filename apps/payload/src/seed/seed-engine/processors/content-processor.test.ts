/**
 * Unit tests for ContentProcessor
 *
 * Tests generic content processing via Payload Local API.
 *
 * @module seed-engine/processors/content-processor.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContentProcessor } from './content-processor';
import type { Payload, ReferenceCache, SeedRecord } from '../types';
import type { DataFromCollectionSlug } from 'payload';

describe('ContentProcessor', () => {
  let mockPayload: Payload;
  let referenceCache: ReferenceCache;
  let processor: ContentProcessor;

  beforeEach(() => {
    // Create mock Payload instance with create method
    mockPayload = {
      create: vi.fn(),
    } as unknown as Payload;

    referenceCache = new Map();
    processor = new ContentProcessor(mockPayload, 'courses', referenceCache);
  });

  describe('processRecord', () => {
    it('should create record via Payload API', async () => {
      const record: SeedRecord = {
        _ref: 'ddm',
        slug: 'data-driven-marketing',
        title: 'Data-Driven Marketing',
      };

      const mockCreatedRecord = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'data-driven-marketing',
        title: 'Data-Driven Marketing',
      };

      vi.mocked(mockPayload.create).mockResolvedValue(mockCreatedRecord as DataFromCollectionSlug<'courses'>);

      const uuid = await processor.processRecord(record);

      expect(uuid).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(mockPayload.create).toHaveBeenCalledTimes(1);
    });

    it('should remove metadata fields before creation', async () => {
      const record: SeedRecord = {
        _ref: 'test-ref',
        _status: 'pending',
        title: 'Test Course',
        slug: 'test-course',
      };

      const mockCreatedRecord = {
        id: 'uuid-123',
        title: 'Test Course',
        slug: 'test-course',
      };

      vi.mocked(mockPayload.create).mockResolvedValue(mockCreatedRecord as DataFromCollectionSlug<'courses'>);

      await processor.processRecord(record);

      // Verify _ref was removed but _status is re-added for Payload versioning
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'courses',
        data: {
          title: 'Test Course',
          slug: 'test-course',
          _status: 'pending',
        },
        draft: false,
        overrideAccess: true,
        disableVerificationEmail: true,
      });
    });

    it('should pass collection name to Payload', async () => {
      const record: SeedRecord = {
        _ref: 'test',
        title: 'Test',
      };

      const mockCreatedRecord = { id: 'uuid-123', title: 'Test' };
      vi.mocked(mockPayload.create).mockResolvedValue(mockCreatedRecord as DataFromCollectionSlug<'courses'>);

      await processor.processRecord(record);

      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'courses',
          draft: false,
          overrideAccess: true,
          disableVerificationEmail: true,
        }),
      );
    });

    it('should preserve nested objects and arrays', async () => {
      const record: SeedRecord = {
        _ref: 'complex-course',
        title: 'Complex Course',
        metadata: {
          tags: ['tag1', 'tag2'],
          level: 'advanced',
        },
        lessons: [1, 2, 3],
      };

      const mockCreatedRecord = { id: 'uuid-123', ...record };
      vi.mocked(mockPayload.create).mockResolvedValue(mockCreatedRecord as DataFromCollectionSlug<'courses'>);

      await processor.processRecord(record);

      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'courses',
        data: expect.objectContaining({
          title: 'Complex Course',
          metadata: {
            tags: ['tag1', 'tag2'],
            level: 'advanced',
          },
          lessons: [1, 2, 3],
          _status: 'published',
        }),
        draft: false,
        overrideAccess: true,
        disableVerificationEmail: true,
      });
    });

    it('should handle Payload validation errors', async () => {
      const record: SeedRecord = {
        _ref: 'invalid',
        title: '', // Invalid: empty title
      };

      vi.mocked(mockPayload.create).mockRejectedValue(
        new Error('Validation failed: title is required'),
      );

      await expect(processor.processRecord(record)).rejects.toThrow(
        'Failed to create courses record: Validation failed: title is required',
      );
    });

    it('should handle database constraint errors', async () => {
      const record: SeedRecord = {
        _ref: 'duplicate',
        slug: 'existing-slug',
        title: 'Duplicate',
      };

      vi.mocked(mockPayload.create).mockRejectedValue(
        new Error('Unique constraint violation on slug'),
      );

      await expect(processor.processRecord(record)).rejects.toThrow(
        'Failed to create courses record: Unique constraint violation on slug',
      );
    });

    it('should handle collection not found errors', async () => {
      const record: SeedRecord = {
        _ref: 'test',
        title: 'Test',
      };

      vi.mocked(mockPayload.create).mockRejectedValue(
        new Error('Collection not found: invalid-collection'),
      );

      await expect(processor.processRecord(record)).rejects.toThrow(
        'Failed to create courses record: Collection not found',
      );
    });

    it('should handle non-Error exceptions', async () => {
      const record: SeedRecord = {
        _ref: 'test',
        title: 'Test',
      };

      vi.mocked(mockPayload.create).mockRejectedValue('String error');

      await expect(processor.processRecord(record)).rejects.toThrow(
        'Failed to create courses record: Unknown error',
      );
    });
  });

  describe('processAll integration', () => {
    it('should process multiple records successfully', async () => {
      const records: SeedRecord[] = [
        { _ref: 'course-1', title: 'Course 1' },
        { _ref: 'course-2', title: 'Course 2' },
        { _ref: 'course-3', title: 'Course 3' },
      ];

      vi.mocked(mockPayload.create)
        .mockResolvedValueOnce({ id: 'uuid-1', title: 'Course 1' } as DataFromCollectionSlug<'courses'>)
        .mockResolvedValueOnce({ id: 'uuid-2', title: 'Course 2' } as DataFromCollectionSlug<'courses'>)
        .mockResolvedValueOnce({ id: 'uuid-3', title: 'Course 3' } as DataFromCollectionSlug<'courses'>);

      const results = await processor.processAll(records);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[0].recordId).toBe('uuid-1');
      expect(results[1].success).toBe(true);
      expect(results[1].recordId).toBe('uuid-2');
      expect(results[2].success).toBe(true);
      expect(results[2].recordId).toBe('uuid-3');
    });

    it('should register records in reference cache', async () => {
      const records: SeedRecord[] = [
        { _ref: 'ddm', title: 'Data-Driven Marketing' },
        { _ref: 'ai-basics', title: 'AI Basics' },
      ];

      vi.mocked(mockPayload.create)
        .mockResolvedValueOnce({ id: 'uuid-ddm', title: 'Data-Driven Marketing' } as DataFromCollectionSlug<'courses'>)
        .mockResolvedValueOnce({ id: 'uuid-ai', title: 'AI Basics' } as DataFromCollectionSlug<'courses'>);

      await processor.processAll(records);

      expect(referenceCache.get('courses:ddm')).toBe('uuid-ddm');
      expect(referenceCache.get('courses:ai-basics')).toBe('uuid-ai');
    });

    it('should continue processing after partial failure', async () => {
      const records: SeedRecord[] = [
        { _ref: 'course-1', title: 'Course 1' },
        { _ref: 'course-2', title: '' }, // Invalid
        { _ref: 'course-3', title: 'Course 3' },
      ];

      vi.mocked(mockPayload.create)
        .mockResolvedValueOnce({ id: 'uuid-1', title: 'Course 1' } as DataFromCollectionSlug<'courses'>)
        .mockRejectedValueOnce(new Error('Validation failed'))
        .mockResolvedValueOnce({ id: 'uuid-3', title: 'Course 3' } as DataFromCollectionSlug<'courses'>);

      const results = await processor.processAll(records);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[2].success).toBe(true);

      // Only successful records in cache
      expect(referenceCache.has('courses:course-1')).toBe(true);
      expect(referenceCache.has('courses:course-2')).toBe(false);
      expect(referenceCache.has('courses:course-3')).toBe(true);
    });
  });

  describe('different collections', () => {
    it('should work with course-lessons collection', async () => {
      const lessonProcessor = new ContentProcessor(
        mockPayload,
        'course-lessons',
        referenceCache,
      );

      const record: SeedRecord = {
        _ref: 'lesson-1',
        course: 'uuid-of-course',
        title: 'Introduction',
        order: 1,
      };

      vi.mocked(mockPayload.create).mockResolvedValue({
        id: 'lesson-uuid',
        ...record,
      } as DataFromCollectionSlug<'course-lessons'>);

      const uuid = await lessonProcessor.processRecord(record);

      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'course-lessons',
        data: expect.objectContaining({
          course: 'uuid-of-course',
          title: 'Introduction',
          order: 1,
          _status: 'published',
        }),
        draft: false,
        overrideAccess: true,
        disableVerificationEmail: true,
      });
      expect(uuid).toBe('lesson-uuid');
    });

    it('should work with posts collection', async () => {
      const postsProcessor = new ContentProcessor(
        mockPayload,
        'posts',
        referenceCache,
      );

      const record: SeedRecord = {
        _ref: 'post-1',
        title: 'Blog Post',
        slug: 'blog-post',
        content: { type: 'doc', content: [] },
      };

      vi.mocked(mockPayload.create).mockResolvedValue({
        id: 'post-uuid',
        ...record,
      } as DataFromCollectionSlug<'posts'>);

      const uuid = await postsProcessor.processRecord(record);

      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'posts',
        data: expect.objectContaining({
          title: 'Blog Post',
          slug: 'blog-post',
          _status: 'published',
        }),
        draft: false,
        overrideAccess: true,
        disableVerificationEmail: true,
      });
      expect(uuid).toBe('post-uuid');
    });
  });

  describe('edge cases', () => {
    it('should handle record with only required fields', async () => {
      const record: SeedRecord = {
        _ref: 'minimal',
        title: 'Minimal Course',
      };

      vi.mocked(mockPayload.create).mockResolvedValue({
        id: 'uuid-minimal',
        title: 'Minimal Course',
      } as DataFromCollectionSlug<'courses'>);

      const uuid = await processor.processRecord(record);

      expect(uuid).toBe('uuid-minimal');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'courses',
        data: { title: 'Minimal Course', _status: 'published' },
        draft: false,
        overrideAccess: true,
        disableVerificationEmail: true,
      });
    });

    it('should handle record without _ref', async () => {
      const record: SeedRecord = {
        title: 'No Ref Course',
      };

      vi.mocked(mockPayload.create).mockResolvedValue({
        id: 'uuid-no-ref',
        title: 'No Ref Course',
      } as DataFromCollectionSlug<'courses'>);

      const uuid = await processor.processRecord(record);

      expect(uuid).toBe('uuid-no-ref');
    });

    it('should handle null and undefined values', async () => {
      const record: SeedRecord = {
        _ref: 'nullable',
        title: 'Test',
        description: null,
        metadata: undefined,
      };

      vi.mocked(mockPayload.create).mockResolvedValue({
        id: 'uuid-nullable',
        ...record,
      } as DataFromCollectionSlug<'courses'>);

      await processor.processRecord(record);

      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'courses',
        data: expect.objectContaining({
          title: 'Test',
          description: null,
          metadata: undefined,
          _status: 'published',
        }),
        draft: false,
        overrideAccess: true,
        disableVerificationEmail: true,
      });
    });
  });
});
