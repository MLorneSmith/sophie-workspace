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
    it('should require url field', async () => {
      const records: SeedRecord[] = [
        {
          _ref: 'test',
          title: 'Test',
          filename: 'test-file.pdf',
        },
      ];

      await expect(processor.preProcess(records)).rejects.toThrow(
        'Missing required field \'url\'',
      );
    });

    it('should require filename field', async () => {
      const records: SeedRecord[] = [
        {
          _ref: 'test',
          title: 'Test',
          url: 'https://example.com/file.pdf',
        },
      ];

      await expect(processor.preProcess(records)).rejects.toThrow(
        'Missing required field \'filename\'',
      );
    });

    it('should require title field', async () => {
      const records: SeedRecord[] = [
        {
          _ref: 'test',
          filename: 'test-file.pdf',
          url: 'https://example.com/file.pdf',
        },
      ];

      await expect(processor.preProcess(records)).rejects.toThrow(
        'Missing required field \'title\'',
      );
    });

    it('should accept valid records with all required fields', async () => {
      const records: SeedRecord[] = [
        {
          _ref: 'test',
          title: 'Test',
          filename: 'test-file.pdf',
          url: 'https://example.com/file.pdf',
        },
      ];

      await expect(processor.preProcess(records)).resolves.not.toThrow();
    });

    it('should validate URL format', async () => {
      const records: SeedRecord[] = [
        {
          _ref: 'test',
          title: 'Test',
          filename: 'test-file.pdf',
          url: 'not-a-valid-url',
        },
      ];

      await expect(processor.preProcess(records)).rejects.toThrow(
        'Invalid URL format \'not-a-valid-url\'',
      );
    });

    it('should accept various URL schemes', async () => {
      const records: SeedRecord[] = [
        {
          _ref: 'http-url',
          title: 'HTTP',
          filename: 'http-file.pdf',
          url: 'http://example.com/file.pdf',
        },
        {
          _ref: 'https-url',
          title: 'HTTPS',
          filename: 'https-file.pdf',
          url: 'https://example.com/file.pdf',
        },
        {
          _ref: 'ftp-url',
          title: 'FTP',
          filename: 'ftp-file.pdf',
          url: 'ftp://example.com/file.pdf',
        },
      ];

      await expect(processor.preProcess(records)).resolves.not.toThrow();
    });

    it('should collect multiple validation errors', async () => {
      const records: SeedRecord[] = [
        {
          _ref: 'error-1',
          title: 'Error 1',
          filename: 'error1.pdf',
        },
        {
          _ref: 'error-2',
          title: 'Error 2',
          filename: 'error2.pdf',
          url: 'invalid-url',
        },
      ];

      await expect(processor.preProcess(records)).rejects.toThrow(/Missing required field 'url'[\s\S]*Invalid URL format/);
    });
  });

  describe('processRecord', () => {
    it('should preserve pre-assigned UUID', async () => {
      const record: SeedRecord = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        _ref: 'template-1',
        title: 'Marketing Template',
        filename: 'marketing-template.pdf',
        url: 'https://example.com/template.pdf',
      };

      vi.mocked(mockPayload.create).mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Marketing Template',
        filename: 'marketing-template.pdf',
        url: 'https://example.com/template.pdf',
      });

      const uuid = await processor.processRecord(record);

      expect(uuid).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'downloads',
        data: expect.objectContaining({
          id: '123e4567-e89b-12d3-a456-426614174000',
        }),
        draft: true,
        overrideAccess: true,
      });
    });

    it('should allow Payload to generate UUID when not provided', async () => {
      const record: SeedRecord = {
        _ref: 'template-2',
        title: 'Another Template',
        filename: 'another-template.pdf',
        url: 'https://example.com/template2.pdf',
      };

      const generatedUuid = '987fcdeb-51a2-43f7-8d9e-123456789abc';

      vi.mocked(mockPayload.create).mockResolvedValue({
        id: generatedUuid,
        title: 'Another Template',
        filename: 'another-template.pdf',
        url: 'https://example.com/template2.pdf',
      });

      const uuid = await processor.processRecord(record);

      expect(uuid).toBe(generatedUuid);
    });

    it('should remove _ref and _status but keep id and add defaults', async () => {
      const record: SeedRecord = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        _ref: 'template',
        _status: 'pending',
        title: 'Template',
        filename: 'template.pdf',
        url: 'https://example.com/template.pdf',
      };

      vi.mocked(mockPayload.create).mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Template',
        filename: 'template.pdf',
        url: 'https://example.com/template.pdf',
      });

      await processor.processRecord(record);

      expect(mockPayload.create).toHaveBeenCalledWith({
        collection: 'downloads',
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Template',
          filename: 'template.pdf',
          url: 'https://example.com/template.pdf',
          mimeType: 'application/pdf',
          filesize: 0,
          _status: 'published',
        },
        draft: true,
        overrideAccess: true,
      });
    });

    it('should handle external URL downloads', async () => {
      const record: SeedRecord = {
        _ref: 'external-download',
        title: 'External Resource',
        filename: 'resource.zip',
        url: 'https://external.com/resource.zip',
      };

      vi.mocked(mockPayload.create).mockResolvedValue({
        id: 'external-uuid',
        title: 'External Resource',
        filename: 'resource.zip',
        url: 'https://external.com/resource.zip',
      });

      const uuid = await processor.processRecord(record);

      expect(uuid).toBe('external-uuid');
      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            url: 'https://external.com/resource.zip',
            filename: 'resource.zip',
            mimeType: 'application/zip',
          }),
        }),
      );
    });

    it('should infer mimeType from filename', async () => {
      const record: SeedRecord = {
        _ref: 'pdf-download',
        title: 'PDF File',
        filename: 'document.pdf',
        url: 'https://example.com/document.pdf',
      };

      vi.mocked(mockPayload.create).mockResolvedValue({
        id: 'pdf-uuid',
        ...record,
      });

      await processor.processRecord(record);

      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            mimeType: 'application/pdf',
            filesize: 0,
          }),
        }),
      );
    });

    it('should handle Payload creation errors', async () => {
      const record: SeedRecord = {
        _ref: 'failing',
        title: 'Failing',
        filename: 'fail.pdf',
        url: 'https://example.com/fail.pdf',
      };

      vi.mocked(mockPayload.create).mockRejectedValue(
        new Error('Database constraint violation'),
      );

      await expect(processor.processRecord(record)).rejects.toThrow(
        'Failed to create download record for \'fail.pdf\': Database constraint violation',
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
          filename: 'download-1.pdf',
          url: 'https://example.com/1.pdf',
        },
        {
          _ref: 'download-2',
          title: 'Download 2',
          filename: 'download-2.pdf',
          url: 'https://example.com/2.pdf',
        },
        {
          id: '33333333-3333-3333-3333-333333333333',
          _ref: 'download-3',
          title: 'Download 3',
          filename: 'download-3.pdf',
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
          filename: 'template-1.pdf',
          url: 'https://example.com/t1.pdf',
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          _ref: 'template-2',
          title: 'Template 2',
          filename: 'template-2.pdf',
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
          _ref: 'invalid',
          title: 'Invalid',
          filename: 'invalid.pdf',
          // Missing url - will fail validation
        },
      ];

      await expect(processor.preProcess(records)).rejects.toThrow(
        'Downloads validation failed',
      );
    });
  });

  describe('postProcess', () => {
    it('should log warnings on failures', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const records: SeedRecord[] = [
        {
          _ref: 'success',
          title: 'Success',
          filename: 'success.pdf',
          url: 'https://example.com/success.pdf',
        },
        {
          _ref: 'failure',
          title: 'Failure',
          filename: 'failure.pdf',
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
          filename: 'success-1.pdf',
          url: 'https://example.com/s1.pdf',
        },
        {
          _ref: 'success-2',
          title: 'Success 2',
          filename: 'success-2.pdf',
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

    it('should handle records with valid url and filename', async () => {
      const record: SeedRecord = {
        _ref: 'valid',
        title: 'Valid Download',
        filename: 'backup.pdf',
        url: 'https://example.com/backup.pdf',
      };

      vi.mocked(mockPayload.create).mockResolvedValue({
        id: 'uuid-valid',
        title: 'Valid Download',
        filename: 'backup.pdf',
        url: 'https://example.com/backup.pdf',
      });

      await expect(processor.preProcess([record])).resolves.not.toThrow();

      const uuid = await processor.processRecord(record);
      expect(uuid).toBe('uuid-valid');
    });

    it('should handle pre-existing mimeType and filesize', async () => {
      const record: SeedRecord = {
        _ref: 'custom',
        title: 'Custom Metadata',
        filename: 'test.pdf',
        url: 'https://example.com/test.pdf',
        mimeType: 'custom/type',
        filesize: 12345,
      };

      vi.mocked(mockPayload.create).mockResolvedValue({
        id: 'uuid-custom',
        title: 'Custom Metadata',
      });

      const uuid = await processor.processRecord(record);

      expect(uuid).toBe('uuid-custom');
      expect(mockPayload.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            mimeType: 'custom/type',
            filesize: 12345,
          }),
        }),
      );
    });
  });
});
