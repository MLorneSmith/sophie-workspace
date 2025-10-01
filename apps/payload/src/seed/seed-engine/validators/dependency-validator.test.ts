/**
 * Unit Tests for Dependency Validator
 *
 * Tests collection dependency validation, circular dependency detection,
 * and seed order validation.
 */

import { describe, expect, it } from 'vitest';
import type { CollectionConfig } from '../types';
import {
  getUnresolvedDependencies,
  topologicalSort,
  validateDependencies,
  validateSeedOrder,
} from './dependency-validator';

describe('Dependency Validator', () => {
  describe('validateDependencies', () => {
    it('should validate correct dependency configuration', () => {
      // Arrange
      const collections: Record<string, CollectionConfig> = {
        users: {
          name: 'users',
          dataFile: 'users.json',
          processor: 'users',
          dependencies: [],
        },
        media: {
          name: 'media',
          dataFile: 'media.json',
          processor: 'media',
          dependencies: [],
        },
        posts: {
          name: 'posts',
          dataFile: 'posts.json',
          processor: 'content',
          dependencies: ['media'],
        },
      };
      const seedOrder = ['users', 'media', 'posts'];

      // Act
      const result = validateDependencies(collections, seedOrder);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.missingDependencies).toHaveLength(0);
      expect(result.circularDependencies).toHaveLength(0);
    });

    it('should detect missing dependency', () => {
      // Arrange
      const collections: Record<string, CollectionConfig> = {
        posts: {
          name: 'posts',
          dataFile: 'posts.json',
          processor: 'content',
          dependencies: ['media'], // media doesn't exist
        },
      };
      const seedOrder = ['posts'];

      // Act
      const result = validateDependencies(collections, seedOrder);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.missingDependencies.length).toBeGreaterThanOrEqual(1);
      expect(result.missingDependencies.some((err) => err.includes('posts depends on missing collection: media'))).toBe(true);
    });

    it('should detect circular dependency (A -> B -> A)', () => {
      // Arrange
      const collections: Record<string, CollectionConfig> = {
        collectionA: {
          name: 'collectionA',
          dataFile: 'a.json',
          processor: 'content',
          dependencies: ['collectionB'],
        },
        collectionB: {
          name: 'collectionB',
          dataFile: 'b.json',
          processor: 'content',
          dependencies: ['collectionA'],
        },
      };
      const seedOrder = ['collectionA', 'collectionB'];

      // Act
      const result = validateDependencies(collections, seedOrder);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.circularDependencies.length).toBeGreaterThan(0);
      const cycle = result.circularDependencies[0];
      expect(cycle).toContain('collectionA');
      expect(cycle).toContain('collectionB');
    });

    it('should detect circular dependency (A -> B -> C -> A)', () => {
      // Arrange
      const collections: Record<string, CollectionConfig> = {
        collectionA: {
          name: 'collectionA',
          dataFile: 'a.json',
          processor: 'content',
          dependencies: ['collectionB'],
        },
        collectionB: {
          name: 'collectionB',
          dataFile: 'b.json',
          processor: 'content',
          dependencies: ['collectionC'],
        },
        collectionC: {
          name: 'collectionC',
          dataFile: 'c.json',
          processor: 'content',
          dependencies: ['collectionA'],
        },
      };
      const seedOrder = ['collectionA', 'collectionB', 'collectionC'];

      // Act
      const result = validateDependencies(collections, seedOrder);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.circularDependencies.length).toBeGreaterThan(0);
    });

    it('should allow self-references in different branches', () => {
      // Arrange - Diamond dependency pattern (valid)
      const collections: Record<string, CollectionConfig> = {
        base: {
          name: 'base',
          dataFile: 'base.json',
          processor: 'content',
          dependencies: [],
        },
        left: {
          name: 'left',
          dataFile: 'left.json',
          processor: 'content',
          dependencies: ['base'],
        },
        right: {
          name: 'right',
          dataFile: 'right.json',
          processor: 'content',
          dependencies: ['base'],
        },
        top: {
          name: 'top',
          dataFile: 'top.json',
          processor: 'content',
          dependencies: ['left', 'right'],
        },
      };
      const seedOrder = ['base', 'left', 'right', 'top'];

      // Act
      const result = validateDependencies(collections, seedOrder);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.circularDependencies).toHaveLength(0);
    });

    it('should detect multiple missing dependencies', () => {
      // Arrange
      const collections: Record<string, CollectionConfig> = {
        posts: {
          name: 'posts',
          dataFile: 'posts.json',
          processor: 'content',
          dependencies: ['media', 'users', 'categories'],
        },
      };
      const seedOrder = ['posts'];

      // Act
      const result = validateDependencies(collections, seedOrder);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.missingDependencies.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('validateSeedOrder', () => {
    it('should validate correct seed order', () => {
      // Arrange
      const collections: Record<string, CollectionConfig> = {
        users: {
          name: 'users',
          dataFile: 'users.json',
          processor: 'users',
          dependencies: [],
        },
        posts: {
          name: 'posts',
          dataFile: 'posts.json',
          processor: 'content',
          dependencies: ['users'],
        },
      };
      const seedOrder = ['users', 'posts'];

      // Act
      const errors = validateSeedOrder(collections, seedOrder);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should detect incorrect seed order', () => {
      // Arrange
      const collections: Record<string, CollectionConfig> = {
        users: {
          name: 'users',
          dataFile: 'users.json',
          processor: 'users',
          dependencies: [],
        },
        posts: {
          name: 'posts',
          dataFile: 'posts.json',
          processor: 'content',
          dependencies: ['users'],
        },
      };
      const seedOrder = ['posts', 'users']; // Wrong order!

      // Act
      const errors = validateSeedOrder(collections, seedOrder);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('posts depends on users');
      expect(errors[0]).toContain('comes after it');
    });

    it('should detect dependency not in seed order', () => {
      // Arrange
      const collections: Record<string, CollectionConfig> = {
        posts: {
          name: 'posts',
          dataFile: 'posts.json',
          processor: 'content',
          dependencies: ['users'],
        },
      };
      const seedOrder = ['posts']; // users missing from order

      // Act
      const errors = validateSeedOrder(collections, seedOrder);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('users is not in seed order');
    });

    it('should validate complex dependency chain', () => {
      // Arrange
      const collections: Record<string, CollectionConfig> = {
        users: {
          name: 'users',
          dataFile: 'users.json',
          processor: 'users',
          dependencies: [],
        },
        media: {
          name: 'media',
          dataFile: 'media.json',
          processor: 'media',
          dependencies: [],
        },
        posts: {
          name: 'posts',
          dataFile: 'posts.json',
          processor: 'content',
          dependencies: ['media', 'users'],
        },
        comments: {
          name: 'comments',
          dataFile: 'comments.json',
          processor: 'content',
          dependencies: ['posts', 'users'],
        },
      };
      const seedOrder = ['users', 'media', 'posts', 'comments'];

      // Act
      const errors = validateSeedOrder(collections, seedOrder);

      // Assert
      expect(errors).toHaveLength(0);
    });
  });

  describe('getUnresolvedDependencies', () => {
    it('should return empty array when all dependencies resolved', () => {
      // Arrange
      const collections: Record<string, CollectionConfig> = {
        posts: {
          name: 'posts',
          dataFile: 'posts.json',
          processor: 'content',
          dependencies: ['users', 'media'],
        },
      };
      const processed = new Set(['users', 'media']);

      // Act
      const unresolved = getUnresolvedDependencies('posts', collections, processed);

      // Assert
      expect(unresolved).toHaveLength(0);
    });

    it('should return unresolved dependencies', () => {
      // Arrange
      const collections: Record<string, CollectionConfig> = {
        posts: {
          name: 'posts',
          dataFile: 'posts.json',
          processor: 'content',
          dependencies: ['users', 'media', 'categories'],
        },
      };
      const processed = new Set(['users']);

      // Act
      const unresolved = getUnresolvedDependencies('posts', collections, processed);

      // Assert
      expect(unresolved).toHaveLength(2);
      expect(unresolved).toContain('media');
      expect(unresolved).toContain('categories');
    });

    it('should return empty array for non-existent collection', () => {
      // Arrange
      const collections: Record<string, CollectionConfig> = {};
      const processed = new Set<string>();

      // Act
      const unresolved = getUnresolvedDependencies('unknown', collections, processed);

      // Assert
      expect(unresolved).toHaveLength(0);
    });

    it('should return empty array for collection with no dependencies', () => {
      // Arrange
      const collections: Record<string, CollectionConfig> = {
        users: {
          name: 'users',
          dataFile: 'users.json',
          processor: 'users',
          dependencies: [],
        },
      };
      const processed = new Set<string>();

      // Act
      const unresolved = getUnresolvedDependencies('users', collections, processed);

      // Assert
      expect(unresolved).toHaveLength(0);
    });
  });

  describe('topologicalSort', () => {
    it('should sort simple dependency chain', () => {
      // Arrange
      const collections: Record<string, CollectionConfig> = {
        users: {
          name: 'users',
          dataFile: 'users.json',
          processor: 'users',
          dependencies: [],
        },
        posts: {
          name: 'posts',
          dataFile: 'posts.json',
          processor: 'content',
          dependencies: ['users'],
        },
        comments: {
          name: 'comments',
          dataFile: 'comments.json',
          processor: 'content',
          dependencies: ['posts'],
        },
      };

      // Act
      const sorted = topologicalSort(collections);

      // Assert
      expect(sorted).not.toBeNull();
      expect(sorted).toHaveLength(3);
      // users must come before posts
      expect(sorted!.indexOf('users')).toBeLessThan(sorted!.indexOf('posts'));
      // posts must come before comments
      expect(sorted!.indexOf('posts')).toBeLessThan(sorted!.indexOf('comments'));
    });

    it('should return null for circular dependency', () => {
      // Arrange
      const collections: Record<string, CollectionConfig> = {
        collectionA: {
          name: 'collectionA',
          dataFile: 'a.json',
          processor: 'content',
          dependencies: ['collectionB'],
        },
        collectionB: {
          name: 'collectionB',
          dataFile: 'b.json',
          processor: 'content',
          dependencies: ['collectionA'],
        },
      };

      // Act
      const sorted = topologicalSort(collections);

      // Assert
      expect(sorted).toBeNull();
    });

    it('should handle diamond dependency pattern', () => {
      // Arrange
      const collections: Record<string, CollectionConfig> = {
        base: {
          name: 'base',
          dataFile: 'base.json',
          processor: 'content',
          dependencies: [],
        },
        left: {
          name: 'left',
          dataFile: 'left.json',
          processor: 'content',
          dependencies: ['base'],
        },
        right: {
          name: 'right',
          dataFile: 'right.json',
          processor: 'content',
          dependencies: ['base'],
        },
        top: {
          name: 'top',
          dataFile: 'top.json',
          processor: 'content',
          dependencies: ['left', 'right'],
        },
      };

      // Act
      const sorted = topologicalSort(collections);

      // Assert
      expect(sorted).not.toBeNull();
      expect(sorted).toHaveLength(4);
      // base must come before left and right
      expect(sorted!.indexOf('base')).toBeLessThan(sorted!.indexOf('left'));
      expect(sorted!.indexOf('base')).toBeLessThan(sorted!.indexOf('right'));
      // left and right must come before top
      expect(sorted!.indexOf('left')).toBeLessThan(sorted!.indexOf('top'));
      expect(sorted!.indexOf('right')).toBeLessThan(sorted!.indexOf('top'));
    });

    it('should handle independent collections', () => {
      // Arrange
      const collections: Record<string, CollectionConfig> = {
        users: {
          name: 'users',
          dataFile: 'users.json',
          processor: 'users',
          dependencies: [],
        },
        media: {
          name: 'media',
          dataFile: 'media.json',
          processor: 'media',
          dependencies: [],
        },
        downloads: {
          name: 'downloads',
          dataFile: 'downloads.json',
          processor: 'downloads',
          dependencies: [],
        },
      };

      // Act
      const sorted = topologicalSort(collections);

      // Assert
      expect(sorted).not.toBeNull();
      expect(sorted).toHaveLength(3);
      expect(sorted).toContain('users');
      expect(sorted).toContain('media');
      expect(sorted).toContain('downloads');
    });

    it('should handle empty configuration', () => {
      // Arrange
      const collections: Record<string, CollectionConfig> = {};

      // Act
      const sorted = topologicalSort(collections);

      // Assert
      expect(sorted).not.toBeNull();
      expect(sorted).toHaveLength(0);
    });
  });
});
