/**
 * Unit Tests for Data Validator
 *
 * Tests data structure validation, reference pattern validation,
 * required field validation, and Lexical content validation.
 */

import { describe, expect, it } from 'vitest';
import type { SeedRecord } from '../types';
import {
  buildReferenceMap,
  validateCollectionData,
  validateFieldTypes,
  validateLexicalContent,
  validateReferences,
  validateRequiredFields,
  validateUniqueRefs,
} from './data-validator';

describe('Data Validator', () => {
  describe('validateReferences', () => {
    it('should validate correct references', () => {
      // Arrange
      const records: SeedRecord[] = [
        {
          _ref: 'lesson-1',
          title: 'Introduction',
          course: '{ref:courses:ddm}',
          downloads: ['{ref:downloads:template1}'],
        },
      ];
      const collections = new Set(['courses', 'downloads']);
      const refMap = new Map([
        ['courses:ddm', true],
        ['downloads:template1', true],
      ]);

      // Act
      const result = validateReferences(records, 'course-lessons', collections, refMap);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.invalidReferences).toHaveLength(0);
      expect(result.unresolvedReferences).toHaveLength(0);
    });

    it('should detect invalid reference pattern (missing identifier)', () => {
      // Arrange
      const records: SeedRecord[] = [
        {
          _ref: 'lesson-1',
          course: '{ref:courses}', // Missing identifier
        },
      ];
      const collections = new Set(['courses']);
      const refMap = new Map<string, boolean>();

      // Act
      const result = validateReferences(records, 'course-lessons', collections, refMap);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.invalidReferences.length).toBeGreaterThan(0);
      expect(result.invalidReferences[0]).toContain('Invalid reference pattern');
    });

    it('should detect reference to unknown collection', () => {
      // Arrange
      const records: SeedRecord[] = [
        {
          _ref: 'lesson-1',
          course: '{ref:unknown-collection:ddm}',
        },
      ];
      const collections = new Set(['courses']);
      const refMap = new Map<string, boolean>();

      // Act
      const result = validateReferences(records, 'course-lessons', collections, refMap);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.invalidReferences.length).toBeGreaterThan(0);
      expect(result.invalidReferences[0]).toContain('unknown collection');
    });

    it('should detect unresolved reference (target not exists)', () => {
      // Arrange
      const records: SeedRecord[] = [
        {
          _ref: 'lesson-1',
          course: '{ref:courses:unknown-course}',
        },
      ];
      const collections = new Set(['courses']);
      const refMap = new Map([['courses:ddm', true]]);

      // Act
      const result = validateReferences(records, 'course-lessons', collections, refMap);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.unresolvedReferences.length).toBeGreaterThan(0);
      expect(result.unresolvedReferences[0]).toContain('Unresolved reference');
      expect(result.unresolvedReferences[0]).toContain('unknown-course');
    });

    it('should handle multiple references in single record', () => {
      // Arrange
      const records: SeedRecord[] = [
        {
          _ref: 'lesson-1',
          course: '{ref:courses:ddm}',
          media: '{ref:media:hero}',
          downloads: ['{ref:downloads:template1}', '{ref:downloads:template2}'],
        },
      ];
      const collections = new Set(['courses', 'media', 'downloads']);
      const refMap = new Map([
        ['courses:ddm', true],
        ['media:hero', true],
        ['downloads:template1', true],
        ['downloads:template2', true],
      ]);

      // Act
      const result = validateReferences(records, 'course-lessons', collections, refMap);

      // Assert
      expect(result.isValid).toBe(true);
    });

    it('should handle nested references in objects', () => {
      // Arrange
      const records: SeedRecord[] = [
        {
          _ref: 'post-1',
          hero: {
            image: '{ref:media:hero-image}',
          },
        },
      ];
      const collections = new Set(['media']);
      const refMap = new Map([['media:hero-image', true]]);

      // Act
      const result = validateReferences(records, 'posts', collections, refMap);

      // Assert
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateRequiredFields', () => {
    it('should validate records with all required fields', () => {
      // Arrange
      const records: SeedRecord[] = [
        {
          _ref: 'course-1',
          slug: 'data-driven-marketing',
          title: 'Data-Driven Marketing',
        },
      ];

      // Act
      const errors = validateRequiredFields(records, 'courses', ['slug', 'title']);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should detect missing required field', () => {
      // Arrange
      const records: SeedRecord[] = [
        {
          _ref: 'course-1',
          slug: 'data-driven-marketing',
          // title is missing
        },
      ];

      // Act
      const errors = validateRequiredFields(records, 'courses', ['slug', 'title']);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Missing required field "title"');
    });

    it('should detect empty string in required field', () => {
      // Arrange
      const records: SeedRecord[] = [
        {
          _ref: 'course-1',
          slug: '',
          title: 'Valid Title',
        },
      ];

      // Act
      const errors = validateRequiredFields(records, 'courses', ['slug', 'title']);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Required field "slug" is empty');
    });

    it('should detect null value in required field', () => {
      // Arrange
      const records: SeedRecord[] = [
        {
          _ref: 'course-1',
          slug: 'valid-slug',
          title: null,
        },
      ];

      // Act
      const errors = validateRequiredFields(records, 'courses', ['slug', 'title']);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Missing required field "title"');
    });

    it('should validate multiple records', () => {
      // Arrange
      const records: SeedRecord[] = [
        {
          _ref: 'course-1',
          slug: 'course-1',
          title: 'Course 1',
        },
        {
          _ref: 'course-2',
          slug: 'course-2',
          // title missing
        },
        {
          _ref: 'course-3',
          // slug missing
          title: 'Course 3',
        },
      ];

      // Act
      const errors = validateRequiredFields(records, 'courses', ['slug', 'title']);

      // Assert
      expect(errors).toHaveLength(2);
    });
  });

  describe('validateFieldTypes', () => {
    it('should validate correct field types', () => {
      // Arrange
      const records: SeedRecord[] = [
        {
          _ref: 'course-1',
          slug: 'test-course',
          publishedAt: '2024-01-15T10:00:00Z',
          downloads: ['{ref:downloads:template1}'],
          featured: true,
        },
      ];
      const fieldTypes = new Map([
        ['slug', 'string'],
        ['publishedAt', 'string'],
        ['downloads', 'array'],
        ['featured', 'boolean'],
      ]);

      // Act
      const errors = validateFieldTypes(records, 'courses', fieldTypes);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should detect wrong field type', () => {
      // Arrange
      const records: SeedRecord[] = [
        {
          _ref: 'course-1',
          slug: 123, // Should be string
        },
      ];
      const fieldTypes = new Map([['slug', 'string']]);

      // Act
      const errors = validateFieldTypes(records, 'courses', fieldTypes);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('has type "number", expected "string"');
    });

    it('should detect array vs object mismatch', () => {
      // Arrange
      const records: SeedRecord[] = [
        {
          _ref: 'course-1',
          downloads: { id: '123' }, // Should be array
        },
      ];
      const fieldTypes = new Map([['downloads', 'array']]);

      // Act
      const errors = validateFieldTypes(records, 'courses', fieldTypes);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('has type "object", expected "array"');
    });

    it('should allow undefined/null for optional fields', () => {
      // Arrange
      const records: SeedRecord[] = [
        {
          _ref: 'course-1',
          slug: 'test',
          description: undefined,
          summary: null,
        },
      ];
      const fieldTypes = new Map([
        ['slug', 'string'],
        ['description', 'string'],
        ['summary', 'string'],
      ]);

      // Act
      const errors = validateFieldTypes(records, 'courses', fieldTypes);

      // Assert
      expect(errors).toHaveLength(0);
    });
  });

  describe('validateLexicalContent', () => {
    it('should validate correct Lexical content', () => {
      // Arrange
      const records: SeedRecord[] = [
        {
          _ref: 'post-1',
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
      ];

      // Act
      const errors = validateLexicalContent(records, 'posts', ['content']);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should detect missing root property', () => {
      // Arrange
      const records: SeedRecord[] = [
        {
          _ref: 'post-1',
          content: {
            // Missing root
            type: 'root',
          },
        },
      ];

      // Act
      const errors = validateLexicalContent(records, 'posts', ['content']);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('missing valid root node');
    });

    it('should detect invalid root type', () => {
      // Arrange
      const records: SeedRecord[] = [
        {
          _ref: 'post-1',
          content: {
            root: {
              type: 'paragraph', // Should be 'root'
              children: [],
            },
          },
        },
      ];

      // Act
      const errors = validateLexicalContent(records, 'posts', ['content']);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('root.type should be "root"');
    });

    it('should detect missing children array', () => {
      // Arrange
      const records: SeedRecord[] = [
        {
          _ref: 'post-1',
          content: {
            root: {
              type: 'root',
              // Missing children
            },
          },
        },
      ];

      // Act
      const errors = validateLexicalContent(records, 'posts', ['content']);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('root.children should be an array');
    });

    it('should detect non-object content', () => {
      // Arrange
      const records: SeedRecord[] = [
        {
          _ref: 'post-1',
          content: 'This should be an object',
        },
      ];

      // Act
      const errors = validateLexicalContent(records, 'posts', ['content']);

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('should be an object with root property');
    });

    it('should allow undefined content (optional field)', () => {
      // Arrange
      const records: SeedRecord[] = [
        {
          _ref: 'post-1',
          content: undefined,
        },
      ];

      // Act
      const errors = validateLexicalContent(records, 'posts', ['content']);

      // Assert
      expect(errors).toHaveLength(0);
    });
  });

  describe('validateUniqueRefs', () => {
    it('should validate unique _ref values', () => {
      // Arrange
      const records: SeedRecord[] = [
        { _ref: 'ref-1', title: 'Record 1' },
        { _ref: 'ref-2', title: 'Record 2' },
        { _ref: 'ref-3', title: 'Record 3' },
      ];

      // Act
      const errors = validateUniqueRefs(records, 'courses');

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should detect duplicate _ref values', () => {
      // Arrange
      const records: SeedRecord[] = [
        { _ref: 'duplicate', title: 'Record 1' },
        { _ref: 'unique', title: 'Record 2' },
        { _ref: 'duplicate', title: 'Record 3' },
      ];

      // Act
      const errors = validateUniqueRefs(records, 'courses');

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('Duplicate _ref "duplicate"');
      expect(errors[0]).toContain('indices: 0, 2');
    });

    it('should detect empty _ref string', () => {
      // Arrange
      const records: SeedRecord[] = [{ _ref: '', title: 'Record 1' }];

      // Act
      const errors = validateUniqueRefs(records, 'courses');

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('_ref cannot be empty');
    });

    it('should detect non-string _ref', () => {
      // Arrange
      const records: SeedRecord[] = [{ _ref: 123 as unknown as string, title: 'Record 1' }];

      // Act
      const errors = validateUniqueRefs(records, 'courses');

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain('_ref should be a string');
    });

    it('should allow missing _ref (optional field)', () => {
      // Arrange
      const records: SeedRecord[] = [
        { _ref: 'ref-1', title: 'Record 1' },
        { title: 'Record 2' }, // No _ref
        { _ref: undefined, title: 'Record 3' },
      ];

      // Act
      const errors = validateUniqueRefs(records, 'courses');

      // Assert
      expect(errors).toHaveLength(0);
    });
  });

  describe('buildReferenceMap', () => {
    it('should build reference map from multiple collections', () => {
      // Arrange
      const allRecords = {
        courses: [
          { _ref: 'ddm', title: 'Course 1' },
          { _ref: 'advanced', title: 'Course 2' },
        ],
        media: [{ _ref: 'hero-image', alt: 'Hero' }],
        downloads: [
          { _ref: 'template1', name: 'Template 1' },
          { _ref: 'template2', name: 'Template 2' },
        ],
      };

      // Act
      const refMap = buildReferenceMap(allRecords);

      // Assert
      expect(refMap.size).toBe(5);
      expect(refMap.has('courses:ddm')).toBe(true);
      expect(refMap.has('courses:advanced')).toBe(true);
      expect(refMap.has('media:hero-image')).toBe(true);
      expect(refMap.has('downloads:template1')).toBe(true);
      expect(refMap.has('downloads:template2')).toBe(true);
    });

    it('should skip records without _ref', () => {
      // Arrange
      const allRecords = {
        courses: [
          { _ref: 'ddm', title: 'Course 1' },
          { title: 'Course 2' }, // No _ref
        ],
      };

      // Act
      const refMap = buildReferenceMap(allRecords);

      // Assert
      expect(refMap.size).toBe(1);
      expect(refMap.has('courses:ddm')).toBe(true);
    });

    it('should handle empty collections', () => {
      // Arrange
      const allRecords = {
        courses: [],
        media: [],
      };

      // Act
      const refMap = buildReferenceMap(allRecords);

      // Assert
      expect(refMap.size).toBe(0);
    });
  });

  describe('validateCollectionData', () => {
    it('should perform comprehensive validation on valid data', () => {
      // Arrange
      const records: SeedRecord[] = [
        {
          _ref: 'lesson-1',
          slug: 'introduction',
          title: 'Introduction',
          course: '{ref:courses:ddm}',
          content: {
            root: {
              type: 'root',
              children: [],
            },
          },
        },
      ];
      const config = {
        requiredFields: ['slug', 'title'],
        fieldTypes: new Map([
          ['slug', 'string'],
          ['title', 'string'],
        ]),
        contentFields: ['content'],
        allCollections: new Set(['courses']),
        referenceMap: new Map([['courses:ddm', true]]),
      };

      // Act
      const result = validateCollectionData(records, 'course-lessons', config);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect multiple validation issues', () => {
      // Arrange
      const records: SeedRecord[] = [
        {
          _ref: 'lesson-1',
          slug: 123, // Wrong type
          // title missing
          course: '{ref:unknown:course}', // Invalid reference
          content: 'not an object', // Invalid Lexical
        },
        {
          _ref: 'lesson-1', // Duplicate ref
          slug: 'valid',
          title: 'Valid',
        },
      ];
      const config = {
        requiredFields: ['slug', 'title'],
        fieldTypes: new Map([['slug', 'string']]),
        contentFields: ['content'],
        allCollections: new Set(['courses']),
        referenceMap: new Map([['courses:ddm', true]]),
      };

      // Act
      const result = validateCollectionData(records, 'course-lessons', config);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });

    it('should skip optional validations when config not provided', () => {
      // Arrange
      const records: SeedRecord[] = [
        {
          _ref: 'lesson-1',
          slug: 'test',
        },
      ];
      const config = {};

      // Act
      const result = validateCollectionData(records, 'course-lessons', config);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
