/**
 * Unit Tests for Post-Seed Validator
 *
 * Tests post-seeding validation including record counts, relationship integrity,
 * Lexical content validation, and orphaned relationship detection.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Payload } from 'payload';
import {
  checkOrphanedRelationships,
  validatePostSeed,
  verifyLexicalContent,
  verifyRecordCounts,
  verifyRelationshipIntegrity,
} from './post-seed-validator';

/**
 * Mock Payload instance for testing
 */
function createMockPayload(overrides?: Partial<Payload>): Payload {
  return {
    find: vi.fn(),
    findByID: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  } as unknown as Payload;
}

describe('Post-Seed Validator', () => {
  describe('verifyRecordCounts', () => {
    it('should validate correct record counts', async () => {
      // Arrange
      const payload = createMockPayload({
        find: vi.fn().mockImplementation(({ collection }) => {
          const counts: Record<string, number> = {
            courses: 1,
            'course-lessons': 25,
            media: 12,
          };
          return Promise.resolve({ totalDocs: counts[collection] || 0 });
        }),
      });

      const expectedCounts = {
        courses: 1,
        'course-lessons': 25,
        media: 12,
      };

      // Act
      const errors = await verifyRecordCounts(payload, expectedCounts);

      // Assert
      expect(errors).toHaveLength(0);
      expect(payload.find).toHaveBeenCalledTimes(3);
    });

    it('should detect mismatched record counts', async () => {
      // Arrange
      const payload = createMockPayload({
        find: vi.fn().mockImplementation(({ collection }) => {
          const counts: Record<string, number> = {
            courses: 1,
            'course-lessons': 20, // Expected 25, got 20
            media: 12,
          };
          return Promise.resolve({ totalDocs: counts[collection] || 0 });
        }),
      });

      const expectedCounts = {
        courses: 1,
        'course-lessons': 25,
        media: 12,
      };

      // Act
      const errors = await verifyRecordCounts(payload, expectedCounts);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('course-lessons');
      expect(errors[0]).toContain('Expected 25 records, found 20');
    });

    it('should detect missing records (zero count)', async () => {
      // Arrange
      const payload = createMockPayload({
        find: vi.fn().mockImplementation(() => {
          return Promise.resolve({ totalDocs: 0 });
        }),
      });

      const expectedCounts = {
        courses: 1,
      };

      // Act
      const errors = await verifyRecordCounts(payload, expectedCounts);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Expected 1 records, found 0');
    });

    it('should handle query errors gracefully', async () => {
      // Arrange
      const payload = createMockPayload({
        find: vi.fn().mockRejectedValue(new Error('Database connection failed')),
      });

      const expectedCounts = {
        courses: 1,
      };

      // Act
      const errors = await verifyRecordCounts(payload, expectedCounts);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Failed to query records');
      expect(errors[0]).toContain('Database connection failed');
    });

    it('should detect multiple mismatches', async () => {
      // Arrange
      const payload = createMockPayload({
        find: vi.fn().mockImplementation(({ collection }) => {
          const counts: Record<string, number> = {
            courses: 0, // Expected 1
            'course-lessons': 30, // Expected 25
            media: 12, // Correct
          };
          return Promise.resolve({ totalDocs: counts[collection] || 0 });
        }),
      });

      const expectedCounts = {
        courses: 1,
        'course-lessons': 25,
        media: 12,
      };

      // Act
      const errors = await verifyRecordCounts(payload, expectedCounts);

      // Assert
      expect(errors).toHaveLength(2);
    });
  });

  describe('verifyRelationshipIntegrity', () => {
    it('should validate relationships with valid UUIDs', async () => {
      // Arrange
      const payload = createMockPayload({
        find: vi.fn().mockImplementation(({ limit }) => {
          if (limit === 0) {
            return Promise.resolve({ totalDocs: 10 });
          }
          return Promise.resolve({
            docs: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                course_id: '987fcdeb-51a2-43f7-8d9e-123456789abc',
              },
            ],
          });
        }),
      });

      // Act
      const errors = await verifyRelationshipIntegrity(
        payload,
        'course-lessons',
        ['course_id'],
        10,
      );

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should detect invalid UUID format', async () => {
      // Arrange
      const payload = createMockPayload({
        find: vi.fn().mockImplementation(({ limit }) => {
          if (limit === 0) {
            return Promise.resolve({ totalDocs: 10 });
          }
          return Promise.resolve({
            docs: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                course_id: 'not-a-valid-uuid',
              },
            ],
          });
        }),
      });

      // Act
      const errors = await verifyRelationshipIntegrity(
        payload,
        'course-lessons',
        ['course_id'],
        10,
      );

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Invalid relationship reference');
    });

    it('should handle array relationships', async () => {
      // Arrange
      const payload = createMockPayload({
        find: vi.fn().mockImplementation(({ limit }) => {
          if (limit === 0) {
            return Promise.resolve({ totalDocs: 10 });
          }
          return Promise.resolve({
            docs: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                downloads: [
                  '987fcdeb-51a2-43f7-8d9e-123456789abc',
                  '111fcdeb-51a2-43f7-8d9e-123456789def',
                ],
              },
            ],
          });
        }),
      });

      // Act
      const errors = await verifyRelationshipIntegrity(
        payload,
        'course-lessons',
        ['downloads'],
        10,
      );

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should detect invalid UUID in array', async () => {
      // Arrange
      const payload = createMockPayload({
        find: vi.fn().mockImplementation(({ limit }) => {
          if (limit === 0) {
            return Promise.resolve({ totalDocs: 10 });
          }
          return Promise.resolve({
            docs: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                downloads: ['987fcdeb-51a2-43f7-8d9e-123456789abc', 'invalid-uuid'],
              },
            ],
          });
        }),
      });

      // Act
      const errors = await verifyRelationshipIntegrity(
        payload,
        'course-lessons',
        ['downloads'],
        10,
      );

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Contains invalid relationship reference');
    });

    it('should handle object relationships with id property', async () => {
      // Arrange
      const payload = createMockPayload({
        find: vi.fn().mockImplementation(({ limit }) => {
          if (limit === 0) {
            return Promise.resolve({ totalDocs: 10 });
          }
          return Promise.resolve({
            docs: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                course_id: {
                  id: '987fcdeb-51a2-43f7-8d9e-123456789abc',
                  title: 'Course Title',
                },
              },
            ],
          });
        }),
      });

      // Act
      const errors = await verifyRelationshipIntegrity(
        payload,
        'course-lessons',
        ['course_id'],
        10,
      );

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should skip null/undefined relationships', async () => {
      // Arrange
      const payload = createMockPayload({
        find: vi.fn().mockImplementation(({ limit }) => {
          if (limit === 0) {
            return Promise.resolve({ totalDocs: 10 });
          }
          return Promise.resolve({
            docs: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                course_id: null,
                media: undefined,
              },
            ],
          });
        }),
      });

      // Act
      const errors = await verifyRelationshipIntegrity(
        payload,
        'course-lessons',
        ['course_id', 'media'],
        10,
      );

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should respect sample rate', async () => {
      // Arrange
      const findMock = vi.fn().mockImplementation(({ limit }) => {
        if (limit === 0) {
          return Promise.resolve({ totalDocs: 100 });
        }
        return Promise.resolve({
          docs: Array(limit).fill({
            id: '123e4567-e89b-12d3-a456-426614174000',
            course_id: '987fcdeb-51a2-43f7-8d9e-123456789abc',
          }),
        });
      });

      const payload = createMockPayload({
        find: findMock,
      });

      // Act - Check 10% of 100 records = 10 records
      await verifyRelationshipIntegrity(payload, 'course-lessons', ['course_id'], 10);

      // Assert - Should call find twice: once for count, once for sample
      expect(findMock).toHaveBeenCalledTimes(2);
      const sampleCall = findMock.mock.calls[1][0];
      expect(sampleCall.limit).toBe(10);
    });

    it('should throw error for invalid sample rate', async () => {
      // Arrange
      const payload = createMockPayload();

      // Act & Assert
      await expect(
        verifyRelationshipIntegrity(payload, 'courses', ['field'], 0),
      ).rejects.toThrow('Sample rate must be between 0 and 100');

      await expect(
        verifyRelationshipIntegrity(payload, 'courses', ['field'], 101),
      ).rejects.toThrow('Sample rate must be between 0 and 100');
    });

    it('should handle empty collection gracefully', async () => {
      // Arrange
      const payload = createMockPayload({
        find: vi.fn().mockResolvedValue({ totalDocs: 0, docs: [] }),
      });

      // Act
      const errors = await verifyRelationshipIntegrity(
        payload,
        'course-lessons',
        ['course_id'],
        10,
      );

      // Assert
      expect(errors).toHaveLength(0);
    });
  });

  describe('verifyLexicalContent', () => {
    it('should validate correct Lexical content', async () => {
      // Arrange
      const payload = createMockPayload({
        find: vi.fn().mockImplementation(({ limit }) => {
          if (limit === 0) {
            return Promise.resolve({ totalDocs: 10 });
          }
          return Promise.resolve({
            docs: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                content: {
                  root: {
                    type: 'root',
                    format: '',
                    indent: 0,
                    version: 1,
                    children: [],
                  },
                },
              },
            ],
          });
        }),
      });

      // Act
      const errors = await verifyLexicalContent(payload, 'posts', ['content'], 10);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should detect missing root property', async () => {
      // Arrange
      const payload = createMockPayload({
        find: vi.fn().mockImplementation(({ limit }) => {
          if (limit === 0) {
            return Promise.resolve({ totalDocs: 10 });
          }
          return Promise.resolve({
            docs: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                content: {
                  // Missing root
                  type: 'root',
                },
              },
            ],
          });
        }),
      });

      // Act
      const errors = await verifyLexicalContent(payload, 'posts', ['content'], 10);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Missing valid root node');
    });

    it('should detect invalid root type', async () => {
      // Arrange
      const payload = createMockPayload({
        find: vi.fn().mockImplementation(({ limit }) => {
          if (limit === 0) {
            return Promise.resolve({ totalDocs: 10 });
          }
          return Promise.resolve({
            docs: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                content: {
                  root: {
                    type: 'paragraph', // Should be 'root'
                    children: [],
                  },
                },
              },
            ],
          });
        }),
      });

      // Act
      const errors = await verifyLexicalContent(payload, 'posts', ['content'], 10);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Root type should be "root"');
    });

    it('should detect missing children array', async () => {
      // Arrange
      const payload = createMockPayload({
        find: vi.fn().mockImplementation(({ limit }) => {
          if (limit === 0) {
            return Promise.resolve({ totalDocs: 10 });
          }
          return Promise.resolve({
            docs: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                content: {
                  root: {
                    type: 'root',
                    // Missing children
                  },
                },
              },
            ],
          });
        }),
      });

      // Act
      const errors = await verifyLexicalContent(payload, 'posts', ['content'], 10);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Root children should be an array');
    });

    it('should detect non-object content', async () => {
      // Arrange
      const payload = createMockPayload({
        find: vi.fn().mockImplementation(({ limit }) => {
          if (limit === 0) {
            return Promise.resolve({ totalDocs: 10 });
          }
          return Promise.resolve({
            docs: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                content: 'This should be an object',
              },
            ],
          });
        }),
      });

      // Act
      const errors = await verifyLexicalContent(payload, 'posts', ['content'], 10);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Content is not an object');
    });

    it('should skip null/undefined content', async () => {
      // Arrange
      const payload = createMockPayload({
        find: vi.fn().mockImplementation(({ limit }) => {
          if (limit === 0) {
            return Promise.resolve({ totalDocs: 10 });
          }
          return Promise.resolve({
            docs: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                content: null,
              },
            ],
          });
        }),
      });

      // Act
      const errors = await verifyLexicalContent(payload, 'posts', ['content'], 10);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should throw error for invalid sample rate', async () => {
      // Arrange
      const payload = createMockPayload();

      // Act & Assert
      await expect(verifyLexicalContent(payload, 'posts', ['content'], 0)).rejects.toThrow(
        'Sample rate must be between 0 and 100',
      );

      await expect(
        verifyLexicalContent(payload, 'posts', ['content'], 101),
      ).rejects.toThrow('Sample rate must be between 0 and 100');
    });
  });

  describe('checkOrphanedRelationships', () => {
    it('should detect orphaned relationships', async () => {
      // Arrange
      const payload = createMockPayload({
        find: vi.fn().mockResolvedValue({
          docs: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              course_id: '987fcdeb-51a2-43f7-8d9e-123456789abc', // This doesn't exist
            },
          ],
        }),
        findByID: vi.fn().mockRejectedValue(new Error('Not found')),
      });

      const relationshipFields = new Map([['course_id', 'courses']]);

      // Act
      const errors = await checkOrphanedRelationships(
        payload,
        'course-lessons',
        relationshipFields,
      );

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('References non-existent courses record');
    });

    it('should validate existing relationships', async () => {
      // Arrange
      const payload = createMockPayload({
        find: vi.fn().mockResolvedValue({
          docs: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              course_id: '987fcdeb-51a2-43f7-8d9e-123456789abc',
            },
          ],
        }),
        findByID: vi.fn().mockResolvedValue({
          id: '987fcdeb-51a2-43f7-8d9e-123456789abc',
        }),
      });

      const relationshipFields = new Map([['course_id', 'courses']]);

      // Act
      const errors = await checkOrphanedRelationships(
        payload,
        'course-lessons',
        relationshipFields,
      );

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should handle array relationships', async () => {
      // Arrange
      const payload = createMockPayload({
        find: vi.fn().mockResolvedValue({
          docs: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              downloads: [
                '987fcdeb-51a2-43f7-8d9e-123456789abc',
                '111fcdeb-51a2-43f7-8d9e-123456789def', // Orphaned
              ],
            },
          ],
        }),
        findByID: vi
          .fn()
          .mockImplementation(({ id }: { id: string }) => {
            if (id === '987fcdeb-51a2-43f7-8d9e-123456789abc') {
              return Promise.resolve({ id });
            }
            return Promise.reject(new Error('Not found'));
          }),
      });

      const relationshipFields = new Map([['downloads', 'downloads']]);

      // Act
      const errors = await checkOrphanedRelationships(
        payload,
        'course-lessons',
        relationshipFields,
      );

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('References non-existent downloads record');
    });

    it('should skip null/undefined relationships', async () => {
      // Arrange
      const payload = createMockPayload({
        find: vi.fn().mockResolvedValue({
          docs: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              course_id: null,
            },
          ],
        }),
      });

      const relationshipFields = new Map([['course_id', 'courses']]);

      // Act
      const errors = await checkOrphanedRelationships(
        payload,
        'course-lessons',
        relationshipFields,
      );

      // Assert
      expect(errors).toHaveLength(0);
    });
  });

  describe('validatePostSeed', () => {
    let mockPayload: Payload;

    beforeEach(() => {
      mockPayload = createMockPayload({
        find: vi.fn().mockImplementation(({ collection, limit }) => {
          if (limit === 0) {
            const counts: Record<string, number> = {
              courses: 1,
              'course-lessons': 25,
              posts: 10,
            };
            return Promise.resolve({ totalDocs: counts[collection] || 0 });
          }
          return Promise.resolve({
            docs: [
              {
                id: '123e4567-e89b-12d3-a456-426614174000',
                content: {
                  root: {
                    type: 'root',
                    children: [],
                  },
                },
              },
            ],
          });
        }),
      });
    });

    it('should perform comprehensive validation', async () => {
      // Arrange
      const expectedCounts = {
        courses: 1,
        'course-lessons': 25,
        posts: 10,
      };

      // Act
      const result = await validatePostSeed(mockPayload, expectedCounts, {
        relationshipSampleRate: 10,
        validateLexicalContent: true,
        checkOrphanedRelationships: false,
      });

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.stats.collectionsChecked).toBe(3);
    });

    it('should return errors when validation fails', async () => {
      // Arrange
      const payload = createMockPayload({
        find: vi.fn().mockResolvedValue({ totalDocs: 0 }), // Wrong count
      });

      const expectedCounts = {
        courses: 1,
      };

      // Act
      const result = await validatePostSeed(payload, expectedCounts);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should respect configuration options', async () => {
      // Arrange
      const expectedCounts = {
        posts: 10,
      };

      // Act
      const result = await validatePostSeed(mockPayload, expectedCounts, {
        collections: ['posts'],
        relationshipSampleRate: 5,
        validateLexicalContent: false,
        checkOrphanedRelationships: false,
      });

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeDefined();
    });

    it('should include warnings for expensive operations', async () => {
      // Arrange
      const expectedCounts = {
        courses: 1,
      };

      // Act
      const result = await validatePostSeed(mockPayload, expectedCounts, {
        checkOrphanedRelationships: true,
      });

      // Assert
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('resource-intensive');
    });
  });
});
