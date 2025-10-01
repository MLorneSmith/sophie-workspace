/**
 * Unit tests for Reference Resolution Engine
 *
 * Tests cover:
 * - Simple reference resolution
 * - Array reference resolution
 * - Nested object resolution
 * - Invalid reference detection
 * - Missing reference errors
 * - Cache registration and lookup
 * - Edge cases (empty strings, null values, circular refs)
 * - All 4 reference patterns
 * - Validation before resolution
 *
 * @module seed-engine/resolvers/reference-resolver.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ReferenceResolver, createReferenceResolver } from './reference-resolver';
import type { SeedRecord } from '../types';

describe('ReferenceResolver', () => {
  let resolver: ReferenceResolver;

  beforeEach(() => {
    resolver = new ReferenceResolver();
  });

  describe('constructor and factory', () => {
    it('should create empty cache on initialization', () => {
      const cache = resolver.getCache();
      expect(cache.size).toBe(0);
    });

    it('should create instance via factory function', () => {
      const instance = createReferenceResolver();
      expect(instance).toBeInstanceOf(ReferenceResolver);
      expect(instance.getCache().size).toBe(0);
    });
  });

  describe('register', () => {
    it('should register UUID for collection/identifier pair', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      resolver.register('courses', 'ddm', uuid);

      const cached = resolver.lookup('courses', 'ddm');
      expect(cached).toBe(uuid);
    });

    it('should register multiple UUIDs', () => {
      const uuid1 = '123e4567-e89b-12d3-a456-426614174000';
      const uuid2 = '987fcdeb-51a2-43f7-8d9e-123456789abc';

      resolver.register('courses', 'ddm', uuid1);
      resolver.register('downloads', 'template1', uuid2);

      expect(resolver.lookup('courses', 'ddm')).toBe(uuid1);
      expect(resolver.lookup('downloads', 'template1')).toBe(uuid2);
      expect(resolver.getCache().size).toBe(2);
    });

    it('should handle path-based identifiers', () => {
      const uuid = '987fcdeb-51a2-43f7-8d9e-123456789abc';
      resolver.register('media', '/cms/images/thumb.png', uuid);

      const cached = resolver.lookup('media', '/cms/images/thumb.png');
      expect(cached).toBe(uuid);
    });

    it('should overwrite existing registration', () => {
      const uuid1 = '123e4567-e89b-12d3-a456-426614174000';
      const uuid2 = '987fcdeb-51a2-43f7-8d9e-123456789abc';

      resolver.register('courses', 'ddm', uuid1);
      resolver.register('courses', 'ddm', uuid2);

      expect(resolver.lookup('courses', 'ddm')).toBe(uuid2);
      expect(resolver.getCache().size).toBe(1);
    });
  });

  describe('lookup', () => {
    it('should return undefined for non-existent reference', () => {
      const result = resolver.lookup('courses', 'unknown');
      expect(result).toBeUndefined();
    });

    it('should distinguish between collections', () => {
      const uuid1 = '123e4567-e89b-12d3-a456-426614174000';
      const uuid2 = '987fcdeb-51a2-43f7-8d9e-123456789abc';

      resolver.register('courses', 'ddm', uuid1);
      resolver.register('lessons', 'ddm', uuid2);

      expect(resolver.lookup('courses', 'ddm')).toBe(uuid1);
      expect(resolver.lookup('lessons', 'ddm')).toBe(uuid2);
    });
  });

  describe('resolve - simple references', () => {
    beforeEach(() => {
      resolver.register('courses', 'ddm', '123e4567-e89b-12d3-a456-426614174000');
      resolver.register('users', 'admin', '987fcdeb-51a2-43f7-8d9e-123456789abc');
    });

    it('should resolve simple string reference', () => {
      const record: SeedRecord = {
        course_id: '{ref:courses:ddm}',
      };

      const resolved = resolver.resolve(record);
      expect(resolved.course_id).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should resolve multiple fields', () => {
      const record: SeedRecord = {
        course_id: '{ref:courses:ddm}',
        author_id: '{ref:users:admin}',
      };

      const resolved = resolver.resolve(record);
      expect(resolved.course_id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(resolved.author_id).toBe('987fcdeb-51a2-43f7-8d9e-123456789abc');
    });

    it('should not mutate original record', () => {
      const record: SeedRecord = {
        course_id: '{ref:courses:ddm}',
      };
      const original = JSON.stringify(record);

      resolver.resolve(record);

      expect(JSON.stringify(record)).toBe(original);
    });

    it('should preserve non-reference strings', () => {
      const record: SeedRecord = {
        course_id: '{ref:courses:ddm}',
        title: 'Regular Title',
        slug: 'regular-slug',
      };

      const resolved = resolver.resolve(record);
      expect(resolved.title).toBe('Regular Title');
      expect(resolved.slug).toBe('regular-slug');
    });
  });

  describe('resolve - array references', () => {
    beforeEach(() => {
      resolver.register('downloads', 't1', '111e1111-e89b-12d3-a456-426614174000');
      resolver.register('downloads', 't2', '222e2222-e89b-12d3-a456-426614174000');
      resolver.register('downloads', 't3', '333e3333-e89b-12d3-a456-426614174000');
    });

    it('should resolve array of references', () => {
      const record: SeedRecord = {
        downloads: ['{ref:downloads:t1}', '{ref:downloads:t2}'],
      };

      const resolved = resolver.resolve(record);
      expect(resolved.downloads).toEqual([
        '111e1111-e89b-12d3-a456-426614174000',
        '222e2222-e89b-12d3-a456-426614174000',
      ]);
    });

    it('should handle empty arrays', () => {
      const record: SeedRecord = {
        downloads: [],
      };

      const resolved = resolver.resolve(record);
      expect(resolved.downloads).toEqual([]);
    });

    it('should handle mixed arrays (references and non-references)', () => {
      const record: SeedRecord = {
        items: ['{ref:downloads:t1}', 'plain-string', 42, true],
      };

      const resolved = resolver.resolve(record);
      expect(resolved.items).toEqual([
        '111e1111-e89b-12d3-a456-426614174000',
        'plain-string',
        42,
        true,
      ]);
    });
  });

  describe('resolve - nested objects', () => {
    beforeEach(() => {
      resolver.register('users', 'admin', '987fcdeb-51a2-43f7-8d9e-123456789abc');
      resolver.register('courses', 'ddm', '123e4567-e89b-12d3-a456-426614174000');
    });

    it('should resolve nested object references', () => {
      const record: SeedRecord = {
        author: {
          id: '{ref:users:admin}',
          name: 'Admin User',
        },
      };

      const resolved = resolver.resolve(record);
      expect(resolved.author).toEqual({
        id: '987fcdeb-51a2-43f7-8d9e-123456789abc',
        name: 'Admin User',
      });
    });

    it('should resolve deeply nested references', () => {
      const record: SeedRecord = {
        level1: {
          level2: {
            level3: {
              course_id: '{ref:courses:ddm}',
            },
          },
        },
      };

      const resolved = resolver.resolve(record);
      expect(resolved.level1).toEqual({
        level2: {
          level3: {
            course_id: '123e4567-e89b-12d3-a456-426614174000',
          },
        },
      });
    });

    it('should resolve references in arrays within objects', () => {
      const record: SeedRecord = {
        metadata: {
          authors: ['{ref:users:admin}'],
          courses: ['{ref:courses:ddm}'],
        },
      };

      const resolved = resolver.resolve(record);
      expect(resolved.metadata).toEqual({
        authors: ['987fcdeb-51a2-43f7-8d9e-123456789abc'],
        courses: ['123e4567-e89b-12d3-a456-426614174000'],
      });
    });
  });

  describe('resolve - embedded references', () => {
    beforeEach(() => {
      resolver.register('users', 'admin', '987fcdeb-51a2-43f7-8d9e-123456789abc');
      resolver.register('courses', 'ddm', '123e4567-e89b-12d3-a456-426614174000');
    });

    it('should resolve embedded references in strings', () => {
      const record: SeedRecord = {
        description: 'Author {ref:users:admin} teaches course {ref:courses:ddm}',
      };

      const resolved = resolver.resolve(record);
      expect(resolved.description).toBe(
        'Author 987fcdeb-51a2-43f7-8d9e-123456789abc teaches course 123e4567-e89b-12d3-a456-426614174000',
      );
    });

    it('should resolve multiple embedded references', () => {
      const record: SeedRecord = {
        text: '{ref:users:admin} and {ref:users:admin} and {ref:courses:ddm}',
      };

      const resolved = resolver.resolve(record);
      expect(resolved.text).toBe(
        '987fcdeb-51a2-43f7-8d9e-123456789abc and 987fcdeb-51a2-43f7-8d9e-123456789abc and 123e4567-e89b-12d3-a456-426614174000',
      );
    });
  });

  describe('resolve - edge cases', () => {
    it('should handle null values', () => {
      const record: SeedRecord = {
        course_id: null,
      };

      const resolved = resolver.resolve(record);
      expect(resolved.course_id).toBeNull();
    });

    it('should handle undefined values', () => {
      const record: SeedRecord = {
        course_id: undefined,
      };

      const resolved = resolver.resolve(record);
      expect(resolved.course_id).toBeUndefined();
    });

    it('should handle empty strings', () => {
      const record: SeedRecord = {
        course_id: '',
      };

      const resolved = resolver.resolve(record);
      expect(resolved.course_id).toBe('');
    });

    it('should handle primitive values', () => {
      const record: SeedRecord = {
        count: 42,
        active: true,
        ratio: 3.14,
      };

      const resolved = resolver.resolve(record);
      expect(resolved.count).toBe(42);
      expect(resolved.active).toBe(true);
      expect(resolved.ratio).toBe(3.14);
    });

    it('should handle records without references', () => {
      const record: SeedRecord = {
        title: 'Plain Record',
        slug: 'plain-record',
        count: 10,
      };

      const resolved = resolver.resolve(record);
      expect(resolved).toEqual(record);
    });

    it('should throw error for unresolved reference', () => {
      const record: SeedRecord = {
        course_id: '{ref:courses:unknown}',
      };

      expect(() => resolver.resolve(record)).toThrow(
        'Unresolved reference: {ref:courses:unknown}',
      );
    });

    it('should throw error on excessive recursion depth', () => {
      // Create deeply nested structure
      let nested: Record<string, unknown> = { value: 'end' };
      for (let i = 0; i < 150; i++) {
        nested = { child: nested };
      }

      const record: SeedRecord = nested;

      expect(() => resolver.resolve(record)).toThrow(
        'Maximum recursion depth (100) exceeded',
      );
    });
  });

  describe('resolve - path-based references', () => {
    beforeEach(() => {
      resolver.register(
        'media',
        '/cms/images/thumb.png',
        '111e1111-e89b-12d3-a456-426614174000',
      );
    });

    it('should resolve path-based media references', () => {
      const record: SeedRecord = {
        thumbnail: '{ref:media:/cms/images/thumb.png}',
      };

      const resolved = resolver.resolve(record);
      expect(resolved.thumbnail).toBe('111e1111-e89b-12d3-a456-426614174000');
    });
  });

  describe('validate', () => {
    beforeEach(() => {
      resolver.register('courses', 'ddm', '123e4567-e89b-12d3-a456-426614174000');
      resolver.register('users', 'admin', '987fcdeb-51a2-43f7-8d9e-123456789abc');
    });

    it('should validate record with all resolvable references', () => {
      const record: SeedRecord = {
        course_id: '{ref:courses:ddm}',
        author_id: '{ref:users:admin}',
      };

      const result = resolver.validate(record);
      expect(result.isValid).toBe(true);
      expect(result.unresolvedReferences).toEqual([]);
    });

    it('should detect unresolved references', () => {
      const record: SeedRecord = {
        course_id: '{ref:courses:unknown}',
        author_id: '{ref:users:admin}',
      };

      const result = resolver.validate(record);
      expect(result.isValid).toBe(false);
      expect(result.unresolvedReferences).toEqual(['{ref:courses:unknown}']);
    });

    it('should detect multiple unresolved references', () => {
      const record: SeedRecord = {
        course_id: '{ref:courses:unknown}',
        author_id: '{ref:users:missing}',
      };

      const result = resolver.validate(record);
      expect(result.isValid).toBe(false);
      expect(result.unresolvedReferences).toHaveLength(2);
      expect(result.unresolvedReferences).toContain('{ref:courses:unknown}');
      expect(result.unresolvedReferences).toContain('{ref:users:missing}');
    });

    it('should validate nested references', () => {
      const record: SeedRecord = {
        metadata: {
          course: '{ref:courses:unknown}',
        },
      };

      const result = resolver.validate(record);
      expect(result.isValid).toBe(false);
      expect(result.unresolvedReferences).toEqual(['{ref:courses:unknown}']);
    });

    it('should validate array references', () => {
      const record: SeedRecord = {
        downloads: ['{ref:downloads:t1}', '{ref:downloads:t2}'],
      };

      const result = resolver.validate(record);
      expect(result.isValid).toBe(false);
      expect(result.unresolvedReferences).toHaveLength(2);
    });

    it('should validate embedded references', () => {
      const record: SeedRecord = {
        text: 'Course {ref:courses:ddm} by {ref:users:unknown}',
      };

      const result = resolver.validate(record);
      expect(result.isValid).toBe(false);
      expect(result.unresolvedReferences).toEqual(['{ref:users:unknown}']);
    });

    it('should handle records without references', () => {
      const record: SeedRecord = {
        title: 'Plain Record',
        slug: 'plain-record',
      };

      const result = resolver.validate(record);
      expect(result.isValid).toBe(true);
      expect(result.unresolvedReferences).toEqual([]);
    });
  });

  describe('getCache', () => {
    it('should return read-only view of cache', () => {
      resolver.register('courses', 'ddm', '123e4567-e89b-12d3-a456-426614174000');

      const cache = resolver.getCache();
      expect(cache.size).toBe(1);
      expect(cache.get('courses:ddm')).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should reflect cache updates', () => {
      const cache1 = resolver.getCache();
      expect(cache1.size).toBe(0);

      resolver.register('courses', 'ddm', '123e4567-e89b-12d3-a456-426614174000');

      const cache2 = resolver.getCache();
      expect(cache2.size).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', () => {
      resolver.register('courses', 'ddm', '123e4567-e89b-12d3-a456-426614174000');
      resolver.register('users', 'admin', '987fcdeb-51a2-43f7-8d9e-123456789abc');

      expect(resolver.getCache().size).toBe(2);

      resolver.clear();

      expect(resolver.getCache().size).toBe(0);
      expect(resolver.lookup('courses', 'ddm')).toBeUndefined();
    });
  });

  describe('getCacheStats', () => {
    it('should return empty stats for empty cache', () => {
      const stats = resolver.getCacheStats();

      expect(stats.size).toBe(0);
      expect(stats.collections).toEqual([]);
      expect(stats.entries).toEqual([]);
    });

    it('should return correct stats with entries', () => {
      resolver.register('courses', 'ddm', '123e4567-e89b-12d3-a456-426614174000');
      resolver.register('users', 'admin', '987fcdeb-51a2-43f7-8d9e-123456789abc');
      resolver.register('courses', 'smm', '111e1111-e89b-12d3-a456-426614174000');

      const stats = resolver.getCacheStats();

      expect(stats.size).toBe(3);
      expect(stats.collections).toEqual(['courses', 'users']);
      expect(stats.entries).toHaveLength(3);
    });

    it('should return sorted collections', () => {
      resolver.register('users', 'admin', '987fcdeb-51a2-43f7-8d9e-123456789abc');
      resolver.register('courses', 'ddm', '123e4567-e89b-12d3-a456-426614174000');
      resolver.register('downloads', 't1', '111e1111-e89b-12d3-a456-426614174000');

      const stats = resolver.getCacheStats();

      expect(stats.collections).toEqual(['courses', 'downloads', 'users']);
    });

    it('should include correct entry details', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      resolver.register('courses', 'ddm', uuid);

      const stats = resolver.getCacheStats();

      expect(stats.entries).toEqual([
        { collection: 'courses', identifier: 'ddm', uuid },
      ]);
    });

    it('should handle path-based identifiers in stats', () => {
      const uuid = '111e1111-e89b-12d3-a456-426614174000';
      resolver.register('media', '/cms/images/thumb.png', uuid);

      const stats = resolver.getCacheStats();

      expect(stats.entries).toEqual([
        { collection: 'media', identifier: '/cms/images/thumb.png', uuid },
      ]);
    });
  });

  describe('complex integration scenarios', () => {
    beforeEach(() => {
      // Setup realistic cache
      resolver.register('courses', 'ddm', '123e4567-e89b-12d3-a456-426614174000');
      resolver.register('users', 'admin', '987fcdeb-51a2-43f7-8d9e-123456789abc');
      resolver.register('downloads', 't1', '111e1111-e89b-12d3-a456-426614174000');
      resolver.register('downloads', 't2', '222e2222-e89b-12d3-a456-426614174000');
      resolver.register(
        'media',
        '/cms/images/thumb.png',
        '333e3333-e89b-12d3-a456-426614174000',
      );
    });

    it('should resolve complex course lesson record', () => {
      const record: SeedRecord = {
        _ref: 'lesson-1',
        title: 'Welcome to DDM',
        slug: 'welcome',
        course_id: '{ref:courses:ddm}',
        author_id: '{ref:users:admin}',
        downloads: ['{ref:downloads:t1}', '{ref:downloads:t2}'],
        metadata: {
          thumbnail: '{ref:media:/cms/images/thumb.png}',
          stats: {
            views: 100,
          },
        },
      };

      const resolved = resolver.resolve(record);

      expect(resolved.course_id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(resolved.author_id).toBe('987fcdeb-51a2-43f7-8d9e-123456789abc');
      expect(resolved.downloads).toEqual([
        '111e1111-e89b-12d3-a456-426614174000',
        '222e2222-e89b-12d3-a456-426614174000',
      ]);
      expect((resolved.metadata as Record<string, unknown>).thumbnail).toBe(
        '333e3333-e89b-12d3-a456-426614174000',
      );
      expect(resolved._ref).toBe('lesson-1');
      expect(resolved.title).toBe('Welcome to DDM');
    });

    it('should validate before resolving', () => {
      const record: SeedRecord = {
        course_id: '{ref:courses:ddm}',
        missing_id: '{ref:courses:unknown}',
      };

      const validation = resolver.validate(record);
      expect(validation.isValid).toBe(false);

      expect(() => resolver.resolve(record)).toThrow('Unresolved reference');
    });

    it('should handle real-world Payload seed data', () => {
      // Based on actual seed data structure
      const record: SeedRecord = {
        _ref: 'course-lessons:lesson-0',
        title: 'Welcome to DDM',
        slug: 'lesson-0',
        course_id: '{ref:courses:ddm}',
        lesson_number: 6,
        downloads: [],
        publishedAt: '2025-06-30T17:27:17.923Z',
        status: 'published',
      };

      const resolved = resolver.resolve(record);

      expect(resolved.course_id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(resolved.downloads).toEqual([]);
      expect(resolved.lesson_number).toBe(6);
      expect(resolved._ref).toBe('course-lessons:lesson-0');
    });
  });

  describe('performance characteristics', () => {
    it('should handle large number of cache entries efficiently', () => {
      // Add 10,000 entries
      const startRegister = Date.now();
      for (let i = 0; i < 10000; i++) {
        resolver.register('collection', `id-${i}`, `uuid-${i}`);
      }
      const registerTime = Date.now() - startRegister;

      // Lookup should be O(1)
      const startLookup = Date.now();
      for (let i = 0; i < 1000; i++) {
        resolver.lookup('collection', `id-${i * 10}`);
      }
      const lookupTime = Date.now() - startLookup;

      expect(resolver.getCache().size).toBe(10000);
      expect(registerTime).toBeLessThan(1000); // Should complete in <1s
      expect(lookupTime).toBeLessThan(100); // 1000 lookups in <100ms
    });

    it('should resolve deeply nested structures efficiently', () => {
      resolver.register('test', 'id', '123e4567-e89b-12d3-a456-426614174000');

      // Create nested structure with 50 levels
      let nested: Record<string, unknown> = { value: '{ref:test:id}' };
      for (let i = 0; i < 49; i++) {
        nested = { child: nested };
      }

      const record: SeedRecord = nested;
      const start = Date.now();
      const resolved = resolver.resolve(record);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(10); // Should resolve in <10ms

      // Verify resolution worked
      let current = resolved;
      for (let i = 0; i < 49; i++) {
        current = (current as Record<string, unknown>).child as Record<
          string,
          unknown
        >;
      }
      expect((current as Record<string, unknown>).value).toBe(
        '123e4567-e89b-12d3-a456-426614174000',
      );
    });
  });
});
