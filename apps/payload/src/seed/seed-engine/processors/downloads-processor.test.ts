/**
 * Unit tests for DownloadsProcessor
 *
 * Tests UUID preservation and downloads-specific processing logic.
 *
 * @module seed-engine/processors/downloads-processor.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DownloadsProcessor } from './downloads-processor';
import type { Payload, ReferenceCache, SeedRecord } from '../types';

describe('DownloadsProcessor', () => {
  let mockPayload: Payload;
  let referenceCache: ReferenceCache;
  let processor: DownloadsProcessor;

  beforeEach(() => {
    mockPayload = {
      create: vi.fn(),
    } as unknown as Payload;

    referenceCache = new Map();
    processor = new DownloadsProcessor(mockPayload, 'downloads', referenceCache);
  });

  describe('preProcess validation', () => {
    it('should validate UUID format', async () => {
      const records: SeedRecord[] = [
        {
          id: 'invalid-uuid',
          _ref: 'test',
          title: 'Test',
          url: 'https://example.com/file.pdf',
        },
      ];

      await expect(processor.preProcess(records)).rejects.toThrow(
        'Invalid UUID format: invalid-uuid',
      );
    });

    it('should accept valid UUIDs', async () => {
      const records: SeedRecord[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          _ref: 'test',
          title: 'Test',
          url: 'https://example.com/file.pdf',
        },
      ];

      await expect(processor.preProcess(records)).resolves.not.toThrow();
    });

    it('should accept lowercase UUIDs', async () => {
      const records: SeedRecord[] = [
        {
          id: 'abcdef12-3456-7890-abcd-ef1234567890',
          _ref: 'test',
          title: 'Test',
          url: 'https://example.com/file.pdf',
        },
      ];

      await expect(processor.preProcess(records)).resolves.not.toThrow();
    });

    it('should accept uppercase UUIDs', async () => {
      const records: SeedRecord[] = [
        {
          id: 'ABCDEF12-3456-7890-ABCD-EF1234567890',
          _ref: 'test',
          title: 'Test',
          url: 'https://example.com/file.pdf',
        },
      ];

      await expect(processor.preProcess(records)).resolves.not.toThrow();
    });

    it('should allow records without id field', async () => {
      const records: SeedRecord[] = [
        {
          _ref: 'test',
          title: 'Test',
          url: 'https://example.com/file.pdf',
        },
      ];

      await expect(processor.preProcess(records)).resolves.not.toThrow();
    });

    it('should require either url or file', async () => {
      const records: SeedRecord[] = [
        {
          _ref: 'test',
          title: 'Test',
          url: null,
          file: null,
        },
      ];

      await expect(processor.preProcess(records)).rejects.toThrow(
        'Must have either url or file reference',
      );
    });

    it('should accept record with url only', async () => {
      const records: SeedRecord[] = [
        {
          _ref: 'test',
          title: 'Test',
          url: 'https://example.com/file.pdf',
          file: null,
        },
      ];

      await expect(processor.preProcess(records)).resolves.not.toThrow();
    });

    it('should accept record with file only', async () => {
      const records: SeedRecord[] = [
        {
          _ref: 'test',
          title: 'Test',
          url: null,
          file: 'media-uuid',
        },
      ];

      await expect(processor.preProcess(records)).resolves.not.toThrow();
    });

    it('should validate URL format', async () => {
      const records: SeedRecord[] = [
        {
          _ref: 'test',
          title: 'Test',
          url: 'not-a-valid-url',
          file: null,
        },
      ];

      await expect(processor.preProcess(records)).rejects.toThrow(
        'Invalid URL format: not-a-valid-url',
      );
    });

    it('should accept various URL schemes', async () => {
      const records: SeedRecord[] = [
        {
          _ref: 'http-url',
          title: 'HTTP',
          url: 'http://example.com/file.pdf',
        },
        {
          _ref: 'https-url',
          title: 'HTTPS',
          url: 'https://example.com/file.pdf',
        },
        {
          _ref: 'ftp-url',
          title: 'FTP',
          url: 'ftp://example.com/file.pdf',
        },
      ];

      await expect(processor.preProcess(records)).resolves.not.toThrow();
    });

    it('should collect multiple validation errors', async () => {
      const records: SeedRecord[] = [
        {
          id: 'invalid-uuid',
          _ref: 'error-1',
          title: 'Error 1',
          url: null,
          file: null,
        },
        {
          _ref: 'error-2',
          title: 'Error 2',
          url: 'invalid-url',
        },
      ];

      await expect(processor.preProcess(records)).rejects.toThrow(/Invalid UUID format[\s\S]*Must have either url or file[\s\S]*Invalid URL format/);
    });
  });

  describe('processRecord', () => {
    it('should preserve pre-assigned UUID', async () => {
      const record: SeedRecord = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        _ref: 'template-1',
        title: 'Marketing Template',
        url: 'https://example.com/template.pdf',
      };

      vi.mocked(mockPayload.create).mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Marketing Template',
        url: 'https://example.com/template.pdf',
      });

      const uuid = await processor.processRecord(record);

      expect(uuid).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'downloads',
        data: expect.objectContaining({
          id: '123e4567-e89b-12d3-a456-426614174000',
        }),
      });
    });

    it('should allow Payload to generate UUID when not provided', async () => {
      const record: SeedRecord = {
        _ref: 'template-2',
        title: 'Another Template',
        url: 'https://example.com/template2.pdf',
      };

      const generatedUuid = '987fcdeb-51a2-43f7-8d9e-123456789abc';

      vi.mocked(mockPayload.create).mockResolvedValue({
        id: generatedUuid,
        title: 'Another Template',
        url: 'https://example.com/template2.pdf',
      });

      const uuid = await processor.processRecord(record);

      expect(uuid).toBe(generatedUuid);
    });

    it('should remove _ref and _status but keep id', async () => {
      const record: SeedRecord = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        _ref: 'template',
        _status: 'pending',
        title: 'Template',
        url: 'https://example.com/template.pdf',
      };

      vi.mocked(mockPayload.create).mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Template',
        url: 'https://example.com/template.pdf',
      });

      await processor.processRecord(record);

      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'downloads',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Template',
          url: 'https://example.com/template.pdf',
        },
      });
    });

    it('should handle external URL downloads', async () => {
      const record: SeedRecord = {
        id: 'external-uuid',
        _ref: 'external-download',
        title: 'External Resource',
        url: 'https://external.com/resource.zip',
        file: null,
      };

      vi.mocked(mockPayload.create).mockResolvedValue({
        id: 'external-uuid',
        ...record,
      });

      const uuid = await processor.processRecord(record);

      expect(uuid).toBe('external-uuid');
      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            url: 'https://external.com/resource.zip',
            file: null,
          }),
        }),
      );
    });

    it('should handle media file references', async () => {
      const record: SeedRecord = {
        id: 'media-download-uuid',
        _ref: 'media-download',
        title: 'Media File',
        url: null,
        file: 'media-file-uuid',
      };

      vi.mocked(mockPayload.create).mockResolvedValue({
        id: 'media-download-uuid',
        ...record,
      });

      const uuid = await processor.processRecord(record);

      expect(uuid).toBe('media-download-uuid');
      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            url: null,
            file: 'media-file-uuid',
          }),
        }),
      );
    });

    it('should throw error if UUID preservation fails', async () => {
      const record: SeedRecord = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        _ref: 'test',
        title: 'Test',
        url: 'https://example.com/test.pdf',
      };

      // Simulate Payload returning different UUID
      vi.mocked(mockPayload.create).mockResolvedValue({
        id: 'different-uuid',
        title: 'Test',
        url: 'https://example.com/test.pdf',
      });

      await expect(processor.processRecord(record)).rejects.toThrow(
        'UUID preservation failed: expected 123e4567-e89b-12d3-a456-426614174000, got different-uuid',
      );
    });

    it('should handle Payload creation errors', async () => {
      const record: SeedRecord = {
        _ref: 'failing',
        title: 'Failing',
        url: 'https://example.com/fail.pdf',
      };

      vi.mocked(mockPayload.create).mockRejectedValue(
        new Error('Database constraint violation'),
      );

      await expect(processor.processRecord(record)).rejects.toThrow(
        'Failed to create download record: Database constraint violation',
      );
    });

    it('should include UUID in error message when provided', async () => {
      const record: SeedRecord = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        _ref: 'failing',
        title: 'Failing',
        url: 'https://example.com/fail.pdf',
      };

      vi.mocked(mockPayload.create).mockRejectedValue(
        new Error('Creation failed'),
      );

      await expect(processor.processRecord(record)).rejects.toThrow(
        'Failed to create download record with UUID 123e4567-e89b-12d3-a456-426614174000',
      );
    });
  });

  describe('processAll integration', () => {
    it('should process multiple downloads with mixed UUIDs', async () => {
      const records: SeedRecord[] = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          _ref: 'download-1',
          title: 'Download 1',
          url: 'https://example.com/1.pdf',
        },
        {
          _ref: 'download-2',
          title: 'Download 2',
          url: 'https://example.com/2.pdf',
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          _ref: 'download-3',
          title: 'Download 3',
          url: 'https://example.com/3.pdf',
        },
      ];

      vi.mocked(mockPayload.create)
        .mockResolvedValueOnce({ id: '11111111-1111-1111-1111-111111111111', title: 'Download 1' })
        .mockResolvedValueOnce({ id: '22222222-2222-2222-2222-222222222222', title: 'Download 2' })
        .mockResolvedValueOnce({ id: '33333333-3333-3333-3333-333333333333', title: 'Download 3' });

      const results = await processor.processAll(records);

      expect(results).toHaveLength(3);
      expect(results[0].success).toBe(true);
      expect(results[0].recordId).toBe('11111111-1111-1111-1111-111111111111');
      expect(results[1].success).toBe(true);
      expect(results[1].recordId).toBe('22222222-2222-2222-2222-222222222222');
      expect(results[2].success).toBe(true);
      expect(results[2].recordId).toBe('33333333-3333-3333-3333-333333333333');
    });

    it('should register downloads in reference cache', async () => {
      const records: SeedRecord[] = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          _ref: 'template-1',
          title: 'Template 1',
          url: 'https://example.com/t1.pdf',
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          _ref: 'template-2',
          title: 'Template 2',
          url: 'https://example.com/t2.pdf',
        },
      ];

      vi.mocked(mockPayload.create)
        .mockResolvedValueOnce({ id: '11111111-1111-1111-1111-111111111111', title: 'Template 1' })
        .mockResolvedValueOnce({ id: '22222222-2222-2222-2222-222222222222', title: 'Template 2' });

      await processor.processAll(records);

      expect(referenceCache.get('downloads:template-1')).toBe('11111111-1111-1111-1111-111111111111');
      expect(referenceCache.get('downloads:template-2')).toBe('22222222-2222-2222-2222-222222222222');
    });

    it('should handle validation errors in preProcess', async () => {
      const records: SeedRecord[] = [
        {
          id: 'invalid-uuid',
          _ref: 'invalid',
          title: 'Invalid',
          url: 'https://example.com/test.pdf',
        },
      ];

      await expect(processor.processAll(records)).rejects.toThrow(
        'Downloads validation failed',
      );

      expect(mockPayload.create).not.toHaveBeenCalled();
    });
  });

  describe('postProcess', () => {
    it('should log warnings on failures', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const records: SeedRecord[] = [
        {
          _ref: 'success',
          title: 'Success',
          url: 'https://example.com/success.pdf',
        },
        {
          _ref: 'failure',
          title: 'Failure',
          url: 'https://example.com/failure.pdf',
        },
      ];

      vi.mocked(mockPayload.create)
        .mockResolvedValueOnce({ id: 'uuid-success', title: 'Success' })
        .mockRejectedValueOnce(new Error('Creation failed'));

      await processor.processAll(records);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('1 success, 1 failed'),
      );

      consoleSpy.mockRestore();
    });

    it('should not log warnings when all succeed', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const records: SeedRecord[] = [
        {
          _ref: 'success-1',
          title: 'Success 1',
          url: 'https://example.com/s1.pdf',
        },
        {
          _ref: 'success-2',
          title: 'Success 2',
          url: 'https://example.com/s2.pdf',
        },
      ];

      vi.mocked(mockPayload.create)
        .mockResolvedValueOnce({ id: 'uuid-1', title: 'Success 1' })
        .mockResolvedValueOnce({ id: 'uuid-2', title: 'Success 2' });

      await processor.processAll(records);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle empty records array', async () => {
      const results = await processor.processAll([]);

      expect(results).toHaveLength(0);
      expect(mockPayload.create).not.toHaveBeenCalled();
    });

    it('should handle records with both url and file', async () => {
      const record: SeedRecord = {
        _ref: 'both',
        title: 'Both',
        url: 'https://example.com/backup.pdf',
        file: 'media-uuid',
      };

      vi.mocked(mockPayload.create).mockResolvedValue({
        id: 'uuid-both',
        ...record,
      });

      await expect(processor.preProcess([record])).resolves.not.toThrow();

      const uuid = await processor.processRecord(record);
      expect(uuid).toBe('uuid-both');
    });

    it('should handle UUID with different casing', async () => {
      const record: SeedRecord = {
        id: 'AbCdEf12-3456-7890-AbCd-Ef1234567890',
        _ref: 'mixed-case',
        title: 'Mixed Case UUID',
        url: 'https://example.com/test.pdf',
      };

      await expect(processor.preProcess([record])).resolves.not.toThrow();

      vi.mocked(mockPayload.create).mockResolvedValue({
        id: 'AbCdEf12-3456-7890-AbCd-Ef1234567890',
        title: 'Mixed Case UUID',
      });

      const uuid = await processor.processRecord(record);
      expect(uuid).toBe('AbCdEf12-3456-7890-AbCd-Ef1234567890');
    });
  });
});
